import { relations } from 'drizzle-orm';
import {
  fixedAssets,
  fixedAssetsPrices,
  inventoriesCategories,
  inventoryMovements,
  productPrices,
  products,
  productServiceSuppliers,
  servicePrices,
  services,
} from '../tables/inventory';
import { suppliers } from '../tables/purchasing';

export const inventoriesCategoriesRelations = relations(
  inventoriesCategories,
  ({ many }) => ({
    products: many(products),
    fixedAssets: many(fixedAssets),
    services: many(services),
  }),
);

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(inventoriesCategories, {
    fields: [products.categoryId],
    references: [inventoriesCategories.id],
  }),
  prices: many(productPrices),
  suppliers: many(productServiceSuppliers),
  movements: many(inventoryMovements, { relationName: 'productMovements' }),
}));

export const productPricesRelations = relations(productPrices, ({ one }) => ({
  product: one(products, {
    fields: [productPrices.productId],
    references: [products.id],
  }),
  supplier: one(suppliers, {
    fields: [productPrices.suppliersId],
    references: [suppliers.id],
  }),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  category: one(inventoriesCategories, {
    fields: [services.categoryId],
    references: [inventoriesCategories.id],
  }),
  prices: many(servicePrices),
  suppliers: many(productServiceSuppliers),
}));

export const servicePricesRelations = relations(servicePrices, ({ one }) => ({
  service: one(services, {
    fields: [servicePrices.serviceId],
    references: [services.id],
  }),
  supplier: one(suppliers, {
    fields: [servicePrices.suppliersId],
    references: [suppliers.id],
  }),
}));

export const fixedAssetsRelations = relations(fixedAssets, ({ one, many }) => ({
  category: one(inventoriesCategories, {
    fields: [fixedAssets.categoryId],
    references: [inventoriesCategories.id],
  }),
  prices: many(fixedAssetsPrices),
  suppliers: many(productServiceSuppliers),
  movements: many(inventoryMovements, { relationName: 'fixedAssetMovements' }),
}));

export const fixedAssetsPricesRelations = relations(
  fixedAssetsPrices,
  ({ one }) => ({
    fixedAsset: one(fixedAssets, {
      fields: [fixedAssetsPrices.fixedAssetsId],
      references: [fixedAssets.id],
    }),
    supplier: one(suppliers, {
      fields: [fixedAssetsPrices.suppliersId],
      references: [suppliers.id],
    }),
  }),
);

export const productServiceSuppliersRelations = relations(
  productServiceSuppliers,
  ({ one }) => ({
    product: one(products, {
      fields: [productServiceSuppliers.productId],
      references: [products.id],
    }),
    service: one(services, {
      fields: [productServiceSuppliers.serviceId],
      references: [services.id],
    }),
    fixedAsset: one(fixedAssets, {
      fields: [productServiceSuppliers.fixedAssetsId],
      references: [fixedAssets.id],
    }),
    supplier: one(suppliers, {
      fields: [productServiceSuppliers.suppliersId],
      references: [suppliers.id],
    }),
  }),
);

export const inventoryMovementsRelations = relations(
  inventoryMovements,
  ({ one }) => ({
    product: one(products, {
      fields: [inventoryMovements.itemId],
      references: [products.id],
      relationName: 'productMovements',
    }),
    fixedAsset: one(fixedAssets, {
      fields: [inventoryMovements.itemId],
      references: [fixedAssets.id],
      relationName: 'fixedAssetMovements',
    }),
  }),
);
