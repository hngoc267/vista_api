function getProductDisplayStatus(status, totalStock) {
  if (status === "discontinued") {
    return "discontinued";
  }

  return totalStock > 0 ? "on_sale" : "out_of_stock";
}

function buildProductStatusConditions(status, inStockProductIds) {
  if (status === "discontinued") {
    return { productStatus: "discontinued" };
  }

  return {
    productStatus: { $ne: "discontinued" },
    productIds: status === "on_sale"
      ? { $in: inStockProductIds }
      : { $nin: inStockProductIds },
  };
}

module.exports = {
  buildProductStatusConditions,
  getProductDisplayStatus,
};
