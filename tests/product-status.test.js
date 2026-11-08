const assert = require("node:assert/strict");
const test = require("node:test");
const {
  buildProductStatusConditions,
  getProductDisplayStatus,
} = require("../services/product-status.service");

test("resolves product status from manager choice and total stock", () => {
  const cases = [
    ["on_sale", 5, "on_sale"],
    ["discontinued", 5, "discontinued"],
    ["discontinued", 0, "discontinued"],
    ["on_sale", 0, "out_of_stock"],
    ["out_of_stock", 3, "on_sale"],
    ["discontinued", 3, "discontinued"],
  ];

  for (const [status, totalStock, expected] of cases) {
    assert.equal(getProductDisplayStatus(status, totalStock), expected);
  }
});

test("builds non-overlapping filters for all three product statuses", () => {
  const inStockProductIds = ["selling-stock", "discontinued-stock"];

  assert.deepEqual(
    buildProductStatusConditions("on_sale", inStockProductIds),
    {
      productStatus: { $ne: "discontinued" },
      productIds: { $in: inStockProductIds },
    },
  );
  assert.deepEqual(
    buildProductStatusConditions("discontinued", inStockProductIds),
    { productStatus: "discontinued" },
  );
  assert.deepEqual(
    buildProductStatusConditions("out_of_stock", inStockProductIds),
    {
      productStatus: { $ne: "discontinued" },
      productIds: { $nin: inStockProductIds },
    },
  );
});

test("status filters select the correct products across multiple variants", () => {
  const products = [
    { Product_id: "selling-stock", Status: "on_sale", stocks: [0, 4] },
    { Product_id: "discontinued-stock", Status: "discontinued", stocks: [2, 2] },
    { Product_id: "selling-empty", Status: "on_sale", stocks: [0, 0] },
    { Product_id: "discontinued-empty", Status: "discontinued", stocks: [0, 0] },
  ];
  const inStockProductIds = products
    .filter((product) => product.stocks.reduce((total, stock) => total + stock, 0) > 0)
    .map((product) => product.Product_id);

  const matchesConditions = (product, conditions) => {
    const matchesStatus = typeof conditions.productStatus === "string"
      ? product.Status === conditions.productStatus
      : product.Status !== conditions.productStatus.$ne;
    const productIds = conditions.productIds;
    const matchesProductId = !productIds ||
      (productIds.$in
        ? productIds.$in.includes(product.Product_id)
        : !productIds.$nin.includes(product.Product_id));
    return matchesStatus && matchesProductId;
  };

  const matchingIds = (status) => products
    .filter((product) => matchesConditions(
      product,
      buildProductStatusConditions(status, inStockProductIds),
    ))
    .map((product) => product.Product_id);

  assert.deepEqual(matchingIds("on_sale"), ["selling-stock"]);
  assert.deepEqual(matchingIds("discontinued"), ["discontinued-stock", "discontinued-empty"]);
  assert.deepEqual(matchingIds("out_of_stock"), ["selling-empty"]);
});

test("public detail status keeps discontinued precedence and checks all variant stock", () => {
  const variants = [{ Stock_quantity: 0 }, { Stock_quantity: 3 }];
  const totalStock = variants.reduce(
    (total, variant) => total + Math.max(0, Number(variant.Stock_quantity) || 0),
    0,
  );

  assert.equal(getProductDisplayStatus("discontinued", totalStock), "discontinued");
  assert.equal(getProductDisplayStatus("on_sale", 0), "out_of_stock");
});
