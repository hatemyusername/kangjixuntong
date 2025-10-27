// 登录验证
document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");

  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;

      if (username === "bpps" && password === "bpps2022") {
        window.location.href = "query.html";
      } else {
        document.getElementById("error").textContent = "用户名或密码错误！";
        document.getElementById("error").style.display = "block";
      }
    });
  }

  if (window.location.pathname.includes("query.html")) {
    initQueryPage();
  }
});
/*
function initQueryPage() {
  createMachineSelect();
  loadExcelData();
  document.getElementById("searchBtn").addEventListener("click", performSearch);
  document.getElementById("downloadBtn").addEventListener("click", function () {
    alert("下载功能尚未实现，仅作演示");
  });
}*/

function initQueryPage() {
  // ✅ 添加：动态检查并添加样式（防止重复）
  if (!document.getElementById("scrollStyle")) {
    const style = document.createElement("style");
    style.id = "scrollStyle";
    style.textContent = `
            #resultContainer {
                max-height: 500px;
                overflow-y: auto;
                border: 1px solid #ddd;
                border-radius: 4px;
                padding: 10px;
                margin-top: 20px;
                background-color: #fff;
            }
            #resultTable {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
            }
            #resultTable th, #resultTable td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
                white-space: nowrap;
            }
            #resultTable th {
                background-color: #f2f2f2;
                position: sticky;
                top: 0;
                z-index: 10;
            }
        `;
    document.head.appendChild(style);
  }

  createMachineSelect();
  loadExcelData();
  document.getElementById("searchBtn").addEventListener("click", performSearch);
  document.getElementById("downloadBtn").addEventListener("click", function () {
    alert("下载功能尚未实现，仅作演示");
  });
}

function createMachineSelect() {
  const select = document.getElementById("machineSelect");

  for (let i = 1; i <= 21; i++) {
    const machineId = `202310${i < 10 ? "0" + i : i}#`;
    const option = document.createElement("option");
    option.value = machineId;
    option.textContent = machineId;
    select.appendChild(option);
  }
}

function loadExcelData() {
  const loading = document.getElementById("loading");
  loading.style.display = "block";

  fetch("data.xlsx")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} - ${response.statusText}`);
      }
      return response.arrayBuffer();
    })
    .then((data) => {
      const workbook = XLSX.read(data, { type: "array" });
      window.excelData = {};

      // ✅ 修复3：将工作表名称转为小写
      workbook.SheetNames.forEach((sheetName, index) => {
        const sheetNameLower = sheetName.toLowerCase();
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        const dataObjects = [];
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (row.length === 0) continue;

          const rowData = {
            date: row[0],
            data1: row[1],
            data2: row[2],
            data3: row[3],
          };
          dataObjects.push(rowData);
        }
        window.excelData[sheetNameLower] = dataObjects;
      });

      loading.style.display = "none";
      document.getElementById("searchBtn").disabled = false;
      document.getElementById("downloadBtn").disabled = false;
    })
    .catch((error) => {
      console.error("Excel 加载失败:", error);
      loading.style.display = "none";
      let msg = "加载数据失败！请检查：\n";
      msg += '- 文件 "data.xlsx" 是否在 query.html 同一目录\n';
      msg += "- 是否使用 Live Server 运行（不是直接双击 HTML）\n";
      msg += "- 错误详情: " + error.message;
      alert(msg);
    });
}

function performSearch() {
  const machineId = document.getElementById("machineSelect").value;
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
    alert("日期格式必须为 YYYY-MM-DD");
    return;
  }

  const machineNumber = machineId.replace("#", "");

  // ✅ 修复1：基础数字设为 20231000
  const baseNumber = 20231000;
  // ✅ 修复2：修正映射公式（-1 确保第一个编号映射到 sheet1）
  const sheetIndex = (parseInt(machineNumber) - baseNumber - 1) % 3;

  const sheetName = `sheet${sheetIndex + 1}`;

  const sheetData = window.excelData[sheetName] || [];

  const filteredData = sheetData.filter((item) => {
    if (!item.date) return false;
    const itemDateOnly = item.date.split(" ")[0];
    return itemDateOnly >= startDate && itemDateOnly <= endDate;
  });

  renderResults(filteredData, sheetName, machineId);
}

function renderResults(data, sheetName, machineId) {
  const resultContainer = document.getElementById("resultContainer");
  resultContainer.innerHTML = "";

  if (data.length === 0) {
    resultContainer.innerHTML = '<p class="no-data">未找到匹配的数据</p>';
    return;
  }

  const table = document.createElement("table");
  table.id = "resultTable";

  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  headerRow.innerHTML = `
        <th>日期时间</th>
        <th>温度(℃)</th>
        <th>湿度(%RH)</th>
        <th>光强(Lux)</th>
    `;
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  data.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${item.date}</td>
            <td>${item.data1}</td>
            <td>${item.data2}</td>
            <td>${item.data3}</td>
        `;
    tbody.appendChild(row);
  });
  table.appendChild(tbody);

  resultContainer.appendChild(table);

  const title = document.createElement("h3");
  //title.textContent = `工作表: ${sheetName} (机器编号: ${machineId})`;//
  title.textContent = `设备编号: ${machineId}`;
  resultContainer.insertBefore(title, resultContainer.firstChild);
}
