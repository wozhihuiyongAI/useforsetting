// admin.js
console.log("DM 管理介面腳本載入完成！");

// ================================
// 全域資料與函式定義
// ================================

function migrateProductsData(data) {
  for (var store in data) {
    data[store].forEach(function(product) {
      // 如果没有 discount 属性则赋予默认值 0
      if (typeof product.discount === "undefined") {
        product.discount = 0;
      }
      // 根据需要添加其他新属性的检测和默认值
    });
  }
  return data;
}

// 在加载 localStorage 后调用迁移函数
productsData = migrateProductsData(productsData);

function updateLocalStorage() {
  localStorage.setItem("productsData", JSON.stringify(productsData));
}

// 定義清空歷史函式（確保此函式在全域中）
function clearOrderHistory() {
  localStorage.removeItem("orderHistory");
  updateOrderHistoryDisplay();
  alert("訂單歷史已清空");
}

// 渲染管理介面中的產品列表（表格形式），並為每筆產品加入「補貨」與「切換上/下架」按鈕
function renderAdminTable() {
  console.log("renderAdminTable: productsData =", productsData);
  var adminContentDiv = document.getElementById("admin-content");
  if (!adminContentDiv) return;
  adminContentDiv.innerHTML = ""; // 清除原有內容

  // 遍歷每個商店
  for (var store in productsData) {
    if (!Array.isArray(productsData[store])) continue;

    // 創建一個商店區塊
    var storeSection = document.createElement("div");
    storeSection.innerHTML = "<h3>商店：" + store + "</h3>";

    // 創建一個表格來展示產品信息
    var table = document.createElement("table");
    table.border = "1";
    table.style.marginBottom = "20px";
    table.style.width = "100%";

    // 建立表頭
    var headerHTML = "<tr>" +
                     "<th>ID</th>" +
                     "<th>商品名稱</th>" +
                     "<th>價格</th>" +
                     "<th>庫存</th>" +
                     "<th>折扣</th>" +
                     "<th>狀態</th>" +
                     "<th>操作</th>" +
                     "</tr>";
    table.innerHTML = headerHTML;

    // 遍歷該商店下的所有產品
    productsData[store].forEach(function(product) {
      var row = document.createElement("tr");

      // 如果庫存低，標記背景顏色
      if (product.stock <= 2) {
        row.style.backgroundColor = "lightcoral";
      }

      // 狀態文字：根據 isVisible 屬性顯示上架或下架
      var statusText = product.isVisible
                        ? '<span style="color:green;">上架</span>'
                        : '<span style="color:red;">下架</span>';

      // 生成行內容（不含操作按鈕）
      row.innerHTML = "<td>" + product.id + "</td>" +
                      "<td>" + product.name + "</td>" +
                      "<td>" + product.price + "</td>" +
                      "<td>" + product.stock + "</td>" +
                      "<td>" + product.discount + "</td>" +
                      "<td>" + statusText + "</td>";

      // 建立操作單元格
      var actionCell = document.createElement("td");

      // 補貨按鈕
      var restockBtn = document.createElement("button");
      restockBtn.textContent = "補貨";
      restockBtn.addEventListener("click", function() {
        var amount = parseInt(prompt("請輸入要補充的數量：", "0"), 10);
        if (!isNaN(amount) && amount > 0) {
          product.stock += amount;
          updateLocalStorage();
          renderAdminTable();
        } else {
          alert("請輸入有效的正整數！");
        }
      });
      actionCell.appendChild(restockBtn);

      // 切換上/下架按鈕
      var toggleBtn = document.createElement("button");
      toggleBtn.textContent = "切換上/下架";
      toggleBtn.addEventListener("click", function() {
        product.isVisible = !product.isVisible;
        updateLocalStorage();
        renderAdminTable();  // 重新渲染整個產品列表
    });
    actionCell.appendChild(toggleBtn);


      // 把操作單元格附加到行中
      row.appendChild(actionCell);

      // 將此行加入表格
      table.appendChild(row);
    });

    storeSection.appendChild(table);
    adminContentDiv.appendChild(storeSection);
  }
}

// 根據訂單資訊自動生成詳細資料字串
function generateOrderDetails(order) {
  var details = "";
  if (order.items && Array.isArray(order.items)) {
    order.items.forEach(function(item) {
      details += item.name + " x " + item.quantity + " = " + item.subtotal + " 金幣\n";
    });
  }
  details += "總金額: " + order.total + " 金幣";
  return details;
}

// 更新訂單歷史顯示
function updateOrderHistoryDisplay() {
  var orderHistoryDiv = document.getElementById("order-history");
  orderHistoryDiv.innerHTML = "";

  var orders = localStorage.getItem("orderHistory")
    ? JSON.parse(localStorage.getItem("orderHistory"))
    : [];
  if (orders.length === 0) {
    orderHistoryDiv.innerText = "目前沒有訂單歷史。";
    return;
  }
  var ul = document.createElement("ul");
  orders.forEach(function(order, index) {
    var li = document.createElement("li");
    var details = order.details || generateOrderDetails(order);
    li.innerHTML = "<strong>訂單 #" + (index + 1) + "：</strong> " +
                   "時間：" + order.time + "<br>" +
                   details.replace(/\n/g, "<br>") + "<br><br>";
    ul.appendChild(li);
  });
  orderHistoryDiv.appendChild(ul);
}

// 匯出訂單歷史到 CSV 文件
function exportOrderHistory() {
  var orders = localStorage.getItem("orderHistory")
    ? JSON.parse(localStorage.getItem("orderHistory"))
    : [];
  if (orders.length === 0) {
    alert("沒有訂單歷史可供匯出");
    return;
  }
  var csvContent = "Order No,Time,Details\n";
  orders.forEach(function(order, index) {
    var details = (order.details || generateOrderDetails(order)).replace(/\n/g, " | ");
    csvContent += (index + 1) + "," + '"' + order.time + '"' + "," + '"' + details + '"' + "\n";
  });
  var blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  var link = document.createElement("a");
  var url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", "order_history.csv");
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  console.log("訂單歷史已匯出");
}

// 渲染銷售報表
function renderSalesReport() {
  var orders = localStorage.getItem("orderHistory")
    ? JSON.parse(localStorage.getItem("orderHistory"))
    : [];
  var reportDiv = document.getElementById("sales-report");
  if (!reportDiv) {
    console.error("找不到 id 為 sales-report 的元素");
    return;
  }
  var totalOrders = orders.length;
  var totalRevenue = orders.reduce(function(sum, order) {
      return sum + order.total;
  }, 0);
  var averageOrder = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0;
  var productStats = {};
  orders.forEach(function(order) {
    (order.items || []).forEach(function(item) {
      if (!productStats[item.name]) {
        productStats[item.name] = 0;
      }
      productStats[item.name] += item.quantity;
    });
  });
  var reportHTML = "<h3>總計</h3>";
  reportHTML += "<p>訂單總數: " + totalOrders + "</p>";
  reportHTML += "<p>總銷售額: " + totalRevenue + " 金幣</p>";
  reportHTML += "<p>平均訂單金額: " + averageOrder + " 金幣</p>";
  reportHTML += "<h3>各商品銷售數量</h3>";
  reportHTML += "<ul>";
  for (var product in productStats) {
    reportHTML += "<li>" + product + ": " + productStats[product] + " 件</li>";
  }
  reportHTML += "</ul>";
  reportDiv.innerHTML = reportHTML;
}

// 渲染低庫存統計
function renderLowStockSummary() {
  
  var lowStockThreshold = 2;
  var lowStockCount = 0;
  for (var store in productsData) {
    productsData[store].forEach(function(product) {
      if (product.stock <= lowStockThreshold) {
        lowStockCount++;
      }
    });
  }
  var summaryDiv = document.getElementById("low-stock-summary");
  if (!summaryDiv) {
    summaryDiv = document.createElement("div");
    summaryDiv.id = "low-stock-summary";
    document.getElementById("admin-content").prepend(summaryDiv);
  }
  summaryDiv.innerHTML = "<h3>低庫存預警</h3><p>總共有 " + lowStockCount + " 件商品庫存不足（≤" + lowStockThreshold + "）!</p>";
}

// 統一更新管理介面（更新商品表格、低庫存統計、銷售報表）
function initializeAdminView() {
  renderAdminTable();
  renderLowStockSummary();
  renderSalesReport();
}

// 在新增商品的處理函數中
document.addEventListener("DOMContentLoaded", function () {
  var addProductForm = document.getElementById("add-product-form");

  if (addProductForm) {
    addProductForm.addEventListener("submit", function (e) {
      e.preventDefault(); // 阻止表單默認提交

      // 獲取表單中的數據
      var store = document.getElementById("product-store").value;
      var name = document.getElementById("product-name").value;
      var price = Number(document.getElementById("product-price").value);
      var stock = Number(document.getElementById("product-stock").value);
      var discount = Number(document.getElementById("product-discount").value);
      var description = document.getElementById("product-description").value;

      // 創建新商品對象，加入 isVisible 屬性，默認為 true（上架）
      var newProduct = {
      id: Date.now(),
      name: name,
      price: price,
      stock: stock,
      discount: discount,
      description: description,
      isVisible: true  // 默認新商品為上架狀態
      };

      // 確保商店數據正確初始化
      if (!productsData[store] || !Array.isArray(productsData[store])) {
        productsData[store] = [];
      }

      // 將新商品添加到對應商店
      productsData[store].push(newProduct);

      // 更新 localStorage
      localStorage.setItem("productsData", JSON.stringify(productsData));

      alert("商品已成功新增！");

      // 清空表單
      addProductForm.reset();

      // 更新管理介面的商品列表
      updateAdminProductList();
    });
  }

  // 初始化管理界面中的商品列表
  updateAdminProductList();
});

/**
 * 更新管理界面的商品列表，确保新增商品正确显示
 */
function updateAdminProductList() {
  var adminListDiv = document.getElementById("admin-content");
  if (!adminListDiv) return;

  var html = "";
  for (var store in productsData) {
    if (!Array.isArray(productsData[store])) continue;
    html += `<h3>商店：${store}</h3>`;
    html += "<ul>";
    productsData[store].forEach(function (product) {
      // 判斷當前商品的狀態
      var statusText = product.isVisible ? '<span style="color:green;">上架</span>' : '<span style="color:red;">下架</span>';
      html += `<li>
                  ID: ${product.id} - ${product.name} (價格: ${product.price}, 庫存: ${product.stock}) 
                  狀態: ${statusText}
                  <button onclick="toggleVisibility('${store}', ${product.id})">切換上/下架</button>
               </li>`;
    });
    html += "</ul>";
  }
  adminListDiv.innerHTML = html;
}

function toggleVisibility(store, productId) {
  // 查找該商店中符合 id 的商品
  var product = productsData[store]?.find(item => item.id == productId);
  if (product) {
    product.isVisible = !product.isVisible;  // 切換狀態
    localStorage.setItem("productsData", JSON.stringify(productsData));
    updateAdminProductList();  // 更新管理界面顯示
  } else {
    console.error("找不到商品，請檢查商品 ID 是否正確。");
  }
}

// ================================
// 事件綁定，僅在 DOM 載入後執行
// ================================
// admin.js

// 當頁面載入完成後綁定各項事件
// 頁面載入後進行事件綁定與初始化
window.addEventListener("load", function() {
  // 清空歷史、匯出訂單、刷新報表等輔助按鈕綁定
  var clearBtn = document.getElementById("clear-history-btn");
  if (clearBtn) {
    clearBtn.addEventListener("click", clearOrderHistory);
    console.log("清空歷史按鈕事件已綁定");
  }
  var exportBtn = document.getElementById("export-history-btn");
  if (exportBtn) {
    exportBtn.addEventListener("click", exportOrderHistory);
    console.log("匯出訂單歷史按鈕事件已綁定");
  }
  var refreshBtn = document.getElementById("refresh-report-btn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", renderSalesReport);
    console.log("刷新報表按鈕事件已綁定");
  }

  // 更新產品表單事件
  var updateForm = document.getElementById("product-update-form");
  if (updateForm) {
    updateForm.addEventListener("submit", function(event) {
      event.preventDefault();
      var store = document.getElementById("store-select").value;
      var productId = parseInt(document.getElementById("product-id").value, 10);
      var newPrice = parseFloat(document.getElementById("new-price").value);
      var newStock = parseInt(document.getElementById("new-stock").value, 10);
      var newDiscount = parseFloat(document.getElementById("new-discount").value);
      var productFound = false;
      productsData[store].forEach(function(product) {
        if (product.id === productId) {
          product.price = newPrice;
          product.stock = newStock;
          product.discount = newDiscount;
          productFound = true;
        }
      });
      if (productFound) {
        updateLocalStorage();
        alert("產品更新成功！");
        renderAdminTable();
      } else {
        alert("找不到該產品，請檢查產品ID是否正確");
      }
    });
  }


  // 綁定更新商品表單的事件（這部分保留原邏輯）
  var updateForm = document.getElementById("product-update-form");
  if (updateForm) {
    updateForm.addEventListener("submit", function(event) {
      event.preventDefault();
      var store = document.getElementById("store-select").value;
      var productId = parseInt(document.getElementById("product-id").value);
      var newPrice = parseFloat(document.getElementById("new-price").value);
      var newStock = parseInt(document.getElementById("new-stock").value);
      var newDiscount = parseFloat(document.getElementById("new-discount").value);
      var productsArray = productsData[store];
      var productFound = false;
      productsArray.forEach(function(product) {
        if (product.id === productId) {
          product.price = newPrice;
          product.stock = newStock;
          product.discount = newDiscount;
          productFound = true;
        }
      });
      if (productFound) {
        updateLocalStorage();
        alert("商品更新成功！");
        initializeAdminView();
      } else {
        alert("找不到該商品，請檢查商品 ID 是否正確");
      }
    });
  } else {
    console.error("找不到 ID 為 product-update-form 的表單");
  }

  document.addEventListener("DOMContentLoaded", function() {
  var addProductForm = document.getElementById("add-product-form");
  console.log("新增產品事件處理器被觸發");

  if (!addProductForm) {
    console.error("找不到 ID 為 add-product-form 的表單！");
    return;
  }

  var isSubmitting = false; // 防止重複提交的旗標

  addProductForm.addEventListener("submit", function(e) {
    e.preventDefault();
    if (isSubmitting) return;
    isSubmitting = true;

    console.log("新增產品提交事件開始");

    var store = document.getElementById("product-store").value;
    var name = document.getElementById("product-name").value;
    var price = parseFloat(document.getElementById("product-price").value);
    var stock = parseInt(document.getElementById("product-stock").value, 10);
    var discount = parseFloat(document.getElementById("product-discount").value);
    var description = document.getElementById("product-description").value;

    var newProduct = {
      id: Date.now(),
      name: name,
      price: price,
      stock: stock,
      discount: discount,
      description: description,
      isVisible: true // 新增時默認設定為上架
    };

    // 確保該商店數據存在
    if (!productsData[store] || !Array.isArray(productsData[store])) {
      productsData[store] = [];
    }

    productsData[store].push(newProduct);
    localStorage.setItem("productsData", JSON.stringify(productsData));
    
    alert("商品新增成功！");
    
    addProductForm.reset();
    updateAdminProductList();

    isSubmitting = false;
  });
});

  // 初始渲染管理列表及其他初始化
  updateAdminProductList();
  initializeAdminView();
  updateOrderHistoryDisplay();
});

// 更新管理介面的商品列表，加入切換上/下架按鈕
function updateAdminProductList() {
  var adminListDiv = document.getElementById("admin-content");
  if (!adminListDiv) return;

  var html = "";
  for (var store in productsData) {
    if (!Array.isArray(productsData[store])) continue;
    html += `<h3>商店：${store}</h3>`;
    html += "<ul>";
    productsData[store].forEach(function (product) {
      var statusText = product.isVisible
        ? '<span style="color:green;">上架</span>'
        : '<span style="color:red;">下架</span>';
      html += `<li>
                ID: ${product.id} - ${product.name} (價格: ${product.price}, 庫存: ${product.stock}) 
                狀態: ${statusText}
                <button onclick="toggleVisibility('${store}', ${product.id})">切換上/下架</button>
               </li>`;
    });
    html += "</ul>";
  }
  adminListDiv.innerHTML = html;
}

// 切換指定商品的上架/下架狀態
function toggleVisibility(store, productId) {
  var product = productsData[store] ? productsData[store].find(item => item.id == productId) : null;
  if (product) {
    product.isVisible = !product.isVisible; // 反轉狀態
    localStorage.setItem("productsData", JSON.stringify(productsData));
    updateAdminProductList();  // 重新渲染管理列表
  } else {
    console.error("找不到商品，請檢查商品 ID 是否正確。");
  }
}


