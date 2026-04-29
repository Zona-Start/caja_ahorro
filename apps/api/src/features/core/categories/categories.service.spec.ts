import { Test, TestingModule } from "@nestjs/testing";
import { CategoriesService } from "./categories.service";
import { AuditHelper } from "../audit/audit-event.service";
import { NotFoundException, ConflictException } from "@nestjs/common";

describe("CategoriesService", () => {
  let service: CategoriesService;
  let db: any;
  let auditHelper: any;

  beforeEach(async () => {
    db = {
      query: {
        categories: {
          findFirst: jest.fn(),
          findMany: jest.fn(),
        },
      },
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      returning: jest.fn(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
    };

    auditHelper = {
      logCreate: jest.fn(),
      logUpdate: jest.fn(),
      logDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: "DB", useValue: db },
        { provide: AuditHelper, useValue: auditHelper },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  const tenantId = "tenant-1";

  describe("create", () => {
    it("should create a category", async () => {
      const dto = { type: "GENDER", code: "M", name: "Male", tenantId };
      db.query.categories.findFirst.mockResolvedValue(null);
      db.returning.mockResolvedValue([{ id: "c1", ...dto }]);

      const result = await service.create(dto as any, tenantId);
      expect(result.id).toBe("c1");
      expect(auditHelper.logCreate).toHaveBeenCalledWith(
        tenantId,
        "category",
        expect.anything(),
        expect.anything(),
      );
    });

    it("should throw ConflictException if code already exists for tenant", async () => {
      const dto = { type: "GENDER", code: "M", name: "Male", tenantId };
      db.query.categories.findFirst.mockResolvedValue({ id: "existing" });

      await expect(service.create(dto as any, tenantId)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe("findById", () => {
    it("should find category for tenant", async () => {
      const mockCategory = { id: "c1", tenantId };
      db.query.categories.findFirst.mockResolvedValue(mockCategory);

      const result = await service.findById("c1", tenantId);
      expect(result).toEqual(mockCategory);
    });

    it("should throw NotFoundException if category belongs to other tenant", async () => {
      db.query.categories.findFirst.mockResolvedValue(null);
      await expect(service.findById("c1", "other-tenant")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("update", () => {
    it("should update category", async () => {
      const mockCategory = { id: "c1", tenantId, name: "Old" };
      db.query.categories.findFirst.mockResolvedValue(mockCategory);
      db.returning.mockResolvedValue([{ ...mockCategory, name: "New" }]);

      const result = await service.update("c1", { name: "New" }, tenantId);
      expect(result.name).toBe("New");
      expect(auditHelper.logUpdate).toHaveBeenCalled();
    });
  });
});
