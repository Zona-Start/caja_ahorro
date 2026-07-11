import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuditHelper } from '../../core/audit/audit-event.service';
import { AssignmentsService } from './assignments.service';

describe('AssignmentsService', () => {
  let service: AssignmentsService;
  let mockAudit: any;
  let mockDb: any;

  const tenantId = 'tenant-1';
  const roleId = 'role-1';

  beforeEach(async () => {
    mockDb = {
      query: {
        roles: { findFirst: jest.fn() },
        rolePermissions: { findMany: jest.fn() },
        permissions: { findFirst: jest.fn() },
      },
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      returning: jest.fn(),
      delete: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
    };

    mockAudit = {
      logUpdate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssignmentsService,
        { provide: 'DB', useValue: mockDb },
        { provide: AuditHelper, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<AssignmentsService>(AssignmentsService);
  });

  it('should assign permissions to role', async () => {
    mockDb.query.roles.findFirst.mockResolvedValue({
      id: roleId,
      tenantId,
      name: 'Admin',
    });
    mockDb.query.permissions.findFirst.mockResolvedValue({
      id: 'p1',
      resource: 'r1',
      action: 'a1',
    });
    mockDb.returning.mockResolvedValue([{ id: 'rp1' }]);

    await service.assignPermissions(
      roleId,
      [{ resource: 'r1', action: 'a1' }],
      tenantId,
    );

    expect(mockDb.delete).toHaveBeenCalled();
    expect(mockDb.insert).toHaveBeenCalled();
    expect(mockAudit.logUpdate).toHaveBeenCalled();
  });

  it('should throw NotFoundException if role belongs to another tenant', async () => {
    mockDb.query.roles.findFirst.mockResolvedValue(null);
    await expect(
      service.getRolePermissions(roleId, 'wrong-tenant'),
    ).rejects.toThrow(NotFoundException);
  });
});
