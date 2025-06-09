/**
 * Interface definitions for AI service method arguments
 * These types replace the usage of 'any' in AI service methods
 */

// Arguments for demand forecasting endpoint
export interface DemandForecastArgs {
  itemId: string;
  branchId: string;
  period: 'weekly' | 'monthly' | 'quarterly';
  periods?: number;
}

// Arguments for purchase optimization endpoint
export interface PurchaseOptimizationArgs {
  itemIds: string[];
  branchId: string;
  budgetLimit?: number;
}

// Arguments for quality analysis endpoint
export interface QualityAnalysisArgs {
  goodsReceiptId: string;
  includeSupplierAnalysis?: boolean;
}

// Arguments for stock prediction endpoint
export interface StockPredictionArgs {
  branchId: string;
  daysAhead?: number;
  itemIds?: string[];
}

// Arguments for auto approval endpoint
export interface AutoApprovalArgs {
  documentId: string;
  documentType: 'PR' | 'PO';
}

// Arguments for intelligent PR generation endpoint
export interface IntelligentPRGenerationArgs {
  branchId: string;
  urgency?: string;
  category?: string;
}

// Arguments for reorder point calculation endpoint
export interface ReorderPointCalculationArgs {
  branchId: string;
  itemId?: string;
}

// Purchase order items for supplier recommendations and maintenance
export interface PurchaseOrderItem {
  id?: string;
  itemId: string;
  quantity: number;
  unitPrice: number;
  deliveryDate?: Date;
  status?: string;
  item?: {
    name: string;
  };
}

// Supplier with purchase order data for analysis
export interface SupplierWithOrders {
  id: string;
  name: string;
  rating?: number;
  purchaseOrders: Array<{
    id: string;
    status: string;
    createdAt: Date;
    deliveryDate?: Date;
    totalAmount: number;
    items: PurchaseOrderItem[];
    goodsReceipts?: Array<{
      id: string;
      status: string;
      receiptDate: Date;
      items: Array<{
        itemId: string;
        quantityReceived: number;
      }>;
    }>;
  }>;
}

// Requirements for supplier recommendations
export interface SupplierRequirements {
  itemIds: string[];
  quantities: number[];
  urgency?: 'low' | 'medium' | 'high';
  budgetConstraint?: number;
  qualityRequirements?: string[];
  deliveryRequirements?: {
    earliestDate?: Date;
    latestDate?: Date;
  };
}

// Equipment data for maintenance predictions
export interface EquipmentData {
  equipmentId: string;
  name: string;
  type: string;
  lastMaintenanceDate?: Date;
  usageHours?: number;
  operatingConditions?: {
    temperature?: number;
    pressure?: number;
    vibration?: number;
  };
  maintenanceHistory?: Array<{
    date: Date;
    type: string;
    cost: number;
    description: string;
  }>;
}

// Purchase request item for optimization
export interface PRItemForOptimization {
  id: string;
  itemId: string;
  estimatedPrice: number;
  quantity: number;
  purchaseRequest: {
    id: string;
    title: string;
    status: string;
    branchId: string;
  };
  item: {
    name: string;
  };
}

// Purchase request data for analysis
export interface PurchaseRequestData {
  id: string;
  prNumber: string;
  title?: string;
  status: string;
  branchId: string;
  requestedById: string;
  totalAmount: number;
  items: Array<{
    itemId: string;
    requestedQty: number;
    estimatedPrice: number;
    item: {
      name: string;
      category?: string;
    };
  }>;
}

// Workflow data for analysis (generic)
export interface WorkflowData {
  id: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  branchId?: string;
  totalAmount?: number;
  items?: Array<{
    itemId: string;
    quantity: number;
    unitPrice?: number;
  }>;
}

// Price history item
export interface PriceHistoryItem {
  itemId: string;
  itemName: string;
  unitPrice: number;
  orderDate: Date;
  quantity: number;
}

// Quality metrics result
export interface QualityMetrics {
  averageQuality: number;
  defectRate: number;
  onTimeDeliveryRate: number;
  supplierRating: number;
}

// Database record interfaces for typed arguments
export interface StockData {
  id: string;
  itemId: string;
  branchId: string;
  currentQuantity: number;
  minStock: number;
  maxStock: number;
  item: {
    id: string;
    name: string;
    description?: string;
  };
  branch: {
    id: string;
    name: string;
  };
}

export interface ConsumptionRecord {
  id: string;
  itemId: string;
  branchId: string;
  quantity: number;
  date: Date;
  type: string;
}

export interface GoodsReceiptData {
  id: string;
  branchId: string;
  purchaseOrderId: string;
  receivedDate: Date;
  items: GoodsReceiptItem[];
  purchaseOrder?: {
    id: string;
    supplier: {
      id: string;
      name: string;
    };
  };
}

export interface GoodsReceiptItem {
  id: string;
  itemId: string;
  receivedQuantity: number;
  qualityNotes?: string;
  item: {
    id: string;
    name: string;
  };
}

export interface SupplierData {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  purchaseOrders: {
    id: string;
    goodsReceipts: GoodsReceiptData[];
  }[];
}

// Prisma where clause types
export interface StockWhereClause {
  branchId: string;
  itemId?: string | { in: string[] };
}

export interface QualityWhereClause {
  branchId?: string;
  itemId?: string;
  receiptDate?: {
    gte: Date;
    lte: Date;
  };
  goodsReceipt?: { branchId: string };
  createdAt?: {
    gte: Date;
    lte: Date;
  };
}

// Purchase Order Item interface for optimization
export interface POItem {
  id: string;
  itemId: string;
  quantity: number;
  unitPrice: number;
  estimatedPrice?: number;
  orderedQty?: number;
  receivedQty?: number;
  item?: {
    id: string;
    name: string;
    description?: string;
  };
  purchaseOrder?: {
    id: string;
    branchId: string;
  };
}

// Order optimization result
export interface OrderOptimization {
  itemId: string;
  itemName: string;
  currentOrderQty: number;
  optimizedOrderQty: number;
  potentialSavings: number;
  reasoning: string[];
}

// Complete order optimization result with summary
export interface OrderOptimizationResult {
  optimizations: OrderOptimization[];
  totalSavings: number;
  budgetCompliant: boolean;
  summary: {
    itemsOptimized: number;
    totalPotentialSavings: number;
    averageSavingsPerItem: number;
  };
}

// Supplier performance data for analysis
export interface SupplierPerformanceData {
  supplierId: string;
  supplierName: string;
  totalOrders: number;
  avgDeliveryTime: number;
  priceHistory: PriceHistoryItem[];
  qualityMetrics: QualityMetrics;
  contactInfo?: string;
}

// Purchase order with goods receipts for supplier analysis
export interface PurchaseOrderWithReceipts {
  orderDate: Date;
  items: Array<{
    itemId: string;
    item: { name: string };
    unitPrice: number;
    quantity: number;
  }>;
  goodsReceipts: Array<{
    receiptDate: Date;
    items: Array<{ qualityNotes?: string }>;
  }>;
}

// Item historical data for optimization
export interface ItemHistoricalData {
  annualDemand: number;
  totalConsumption: number;
  orderFrequency: number;
  averageOrderSize: number;
}

// Goods receipt item with quality information
export interface GRItemWithReceipt {
  receivedQty: number;
  goodsReceipt: {
    postedAt: Date;
    status: string;
  };
}

// Purchase request item with related data
export interface PRItemWithDetails {
  id: string;
  itemId: string;
  estimatedPrice: number;
  quantity: number;
  purchaseRequest: {
    id: string;
    branchId: string;
  };
  item: {
    name: string;
  };
}

// Adjusted PO item for optimization
export interface AdjustedPOItem extends POItem {
  optimizedQty: number;
  estimatedSavings: number;
  reasoning: string;
}

// Automatic Purchase Recommendation interfaces
export interface PurchaseRecommendation {
  itemId: string;
  itemName: string;
  currentStock: number;
  predictedDemand: number;
  recommendedQuantity: number;
  suggestedOrderQty: number;
  confidence: number;
  reasoning: string;
  reason: string;
  urgency: 'high' | 'medium' | 'low';
  estimatedCost: number;
}

export interface AutomaticPRResult {
  recommendations: PurchaseRecommendation[];
  totalEstimatedCost: number;
  priorityOrder: string[];
  createdPurchaseRequests?: Array<{
    id: string;
    prNumber: string;
    itemCount: number;
    totalAmount: number;
  }>;
}

// Extended supplier interface for quality analysis with full nested structure
export interface SupplierWithQualityData {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  purchaseOrders: Array<{
    id: string;
    status: string;
    goodsReceipts: Array<{
      id: string;
      status: string;
      receiptDate: Date;
      items: Array<{
        id: string;
        itemId: string;
        receivedQuantity: number;
        qualityNotes?: string;
        item: {
          id: string;
          name: string;
        };
      }>;
    }>;
  }>;
}

// Extended goods receipt item with receipt date access
export interface GRItemWithReceiptAccess {
  id: string;
  itemId: string;
  receivedQuantity: number;
  qualityNotes?: string;
  item: {
    id: string;
    name: string;
  };
  gr: {
    receiptDate: Date;
  };
}
