import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { AuditHelper } from '../../audit/audit-event.service';
import { TenantsService } from './tenants.service';

describe('TenantsService', () => {
  let service: TenantsService;
  let db: any;
  let auditHelper: any;
  let eventEmitter: any;

  beforeEach(async () => {
    db = {
      query: {
        tenants: {
          findMany: jest.fn(),
          findFirst: jest.fn(),
        },
      },
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      returning: jest.fn(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
    };

    auditHelper = {
      logCreate: jest.fn(),
      logUpdate: jest.fn(),
      logDelete: jest.fn(),
    };

    eventEmitter = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantsService,
        { provide: 'DB', useValue: db },
        { provide: AuditHelper, useValue: auditHelper },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get<TenantsService>(TenantsService);
  });

  describe('findById', () => {
    it('should throw ForbiddenException if not system admin and trying to see other tenant', async () => {
      await expect(
        service.findById('tenant-b', 'tenant-a', false),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return tenant if system admin', async () => {
      const mockTenant = { id: 'tenant-b', name: 'Tenant B' };
      db.query.tenants.findFirst.mockResolvedValue(mockTenant);

      const result = await service.findById('tenant-b', 'tenant-a', true);
      expect(result).toEqual(mockTenant);
    });

    it('should return tenant if matching currentTenantId', async () => {
      const mockTenant = { id: 'tenant-a', name: 'Tenant A' };
      db.query.tenants.findFirst.mockResolvedValue(mockTenant);

      const result = await service.findById('tenant-a', 'tenant-a', false);
      expect(result).toEqual(mockTenant);
    });

    it('should throw NotFoundException if tenant does not exist', async () => {
      db.query.tenants.findFirst.mockResolvedValue(null);
      await expect(service.findById('any-id', 'any-id', true)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should throw ForbiddenException if admin tries to update another tenant', async () => {
      await expect(
        service.update('tenant-b', {}, false, 'tenant-a'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should only update contact fields for non-system admin', async () => {
      const tenantId = 'tenant-a';
      const mockPrevious = {
        id: tenantId,
        name: 'Original Name',
        rif: 'RIF-1',
      };
      db.query.tenants.findFirst.mockResolvedValue(mockPrevious);
      db.returning.mockResolvedValue([
        { ...mockPrevious, contactName: 'New Contact' },
      ]);

      const dto = { name: 'I want to change name', contactName: 'New Contact' };
      await service.update(tenantId, dto, false, tenantId);

      // Verify what was sent to .set()
      const setCall = db.set.mock.calls[0][0];
      expect(setCall.name).toBeUndefined(); // Name should NOT be updated by non-admin
      expect(setCall.contactName).toBe('New Contact');
    });

    it('should update all fields for system admin', async () => {
      const tenantId = 'tenant-a';
      const mockPrevious = { id: tenantId, name: 'Original Name' };
      db.query.tenants.findFirst.mockResolvedValue(mockPrevious);
      db.returning.mockResolvedValue([{ id: tenantId, name: 'New Name' }]);

      const dto = { name: 'New Name', contactName: 'New Contact' };
      await service.update(tenantId, dto, true);

      const setCall = db.set.mock.calls[0][0];
      expect(setCall.name).toBe('New Name');
      expect(setCall.contactName).toBe('New Contact');
    });
  });
});
