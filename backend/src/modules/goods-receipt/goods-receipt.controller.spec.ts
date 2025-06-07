import { Test, type TestingModule } from "@nestjs/testing";
import { Reflector } from "@nestjs/core";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { PrismaService } from "../../app/prisma.service";
import { GoodsReceiptController } from "./goods-receipt.controller";
import { GoodsReceiptService } from "./goods-receipt.service";

describe("GoodsReceiptController", () => {
  let controller: GoodsReceiptController;
  let service: GoodsReceiptService;

  const mockPrismaService = {
    goodsReceipt: {
      count: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    purchaseOrder: {
      findUnique: jest.fn(),
    },
    materialRequisition: {
      findUnique: jest.fn(),
    },
    stock: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    pOItem: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockGoodsReceiptService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    post: jest.fn(),
    cancel: jest.fn(),
    createFromPO: jest.fn(),
    createFromMR: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GoodsReceiptController],
      providers: [
        {
          provide: GoodsReceiptService,
          useValue: mockGoodsReceiptService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: jest.fn(() => true),
      })
      .overrideGuard(RolesGuard)
      .useValue({
        canActivate: jest.fn(() => true),
      })
      .compile();

    controller = module.get<GoodsReceiptController>(GoodsReceiptController);
    service = module.get<GoodsReceiptService>(GoodsReceiptService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("should have service defined", () => {
    expect(service).toBeDefined();
  });
});
