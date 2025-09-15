// --- Donut Stats ---
const statsData = [
  { id: "totalJobsChart", percent: 75, color: "#3B82F6" },
  { id: "totalApplicationsChart", percent: 60, color: "#23c096ff" },
  { id: "activeUsersChart", percent: 40, color: "#83878dff" }
];

const centerTextPlugin = {
  id: 'centerText',
  afterDraw(chart, args, options) {
    const { ctx, chartArea: { width, height } } = chart;
    ctx.save();
    ctx.font = `${height / 4}px Arial`;
    ctx.fillStyle = options.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(options.text, width / 2, height / 2);
    ctx.restore();
  }
};

function createDonutChart({ id, percent, color }) {
  const ctx = document.getElementById(id).getContext("2d");
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ["Filled","Remaining"],
      datasets:[{data:[percent,100-percent], backgroundColor:[color,"#E5E7EB"], borderWidth:0}]
    },
    options: {
      cutout:'70%',
      responsive:false,
      plugins: {
        legend:{display:false},
        tooltip:{enabled:false},
        centerText:{text:percent+"%", color: color}
      }
    },
    plugins:[centerTextPlugin]
  });
}
statsData.forEach(stat => createDonutChart(stat));

// --- Departments ---
const departments = [
  { name: "Engineering", jobs: 12, applications: 45 },
  { name: "Marketing", jobs: 8, applications: 30 },
  { name: "Design", jobs: 5, applications: 18 },
  { name: "HR", jobs: 3, applications: 10 },
  { name: "Sales", jobs: 10, applications: 35 }
];

const departmentGrid = document.getElementById("department-grid");
departments.forEach(dept => {
  const card = document.createElement("div");
  card.className = "department-card";
  const progressPercent = Math.min(Math.round((dept.applications / (dept.jobs*5))*100), 100);
  card.innerHTML = `
    <h3>${dept.name}</h3>
    <p>Jobs: ${dept.jobs}</p>
    <p>Applications: ${dept.applications}</p>
    <div class="progress-bar"><div class="progress-fill" style="width:${progressPercent}%"></div></div>
  `;
  departmentGrid.appendChild(card);
});

// --- Analytics Chart ---
const ctx = document.getElementById("analyticsChart").getContext("2d");
new Chart(ctx,{
  type:"line",
  data:{
    labels:["Jan","Feb","Mar","Apr"],
    datasets:[
      { label:"Applications", data:[30,45,60,50], borderColor:"#2563EB", backgroundColor:"rgba(37,99,235,0.2)", tension:0.4, fill:true },
      { label:"Jobs", data:[5,8,12,10], borderColor:"#3B82F6", backgroundColor:"rgba(59,130,246,0.2)", tension:0.4, fill:true }
    ]
  },
  options: {
    responsive: true,
    plugins: {
      legend: {
        position: "top"
      },
      tooltip: {
        mode: "index",
        intersect: false
      }
    },
    interaction: {
      mode: "nearest",
      intersect: false
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Count"
        }
      },
      x: {
        title: {
          display: true,
          text: "Month"
        }
      }
    }
  }
});
const recentActivities = [
  { time: "2 hours ago", text: "John Doe applied for Marketing job" },
  { time: "4 hours ago", text: "New job posted: Software Engineer" },
  { time: "1 day ago", text: "Jane Smith applied for Design job" },
  { time: "2 days ago", text: "Job closed: Sales Associate" }
];

const activityList = document.getElementById("activity-list");

recentActivities.forEach(activity => {
  const li = document.createElement("li");
  li.textContent = `${activity.time} - ${activity.text}`;
  activityList.appendChild(li);
});
const topDepartments = [
  { name: "Engineering", applications: 45 },
  { name: "Sales", applications: 35 },
  { name: "Marketing", applications: 30 }
];

const topDeptGrid = document.getElementById("top-departments-grid");

topDepartments.forEach(dept => {
  const card = document.createElement("div");
  card.className = "department-card"; // reuse existing card style
  card.innerHTML = `
    <h3>${dept.name}</h3>
    <p>Applications: ${dept.applications}</p>
  `;
  topDeptGrid.appendChild(card);
});

const applications = [
    { name: "John Doe", job: "Software Engineer" },
    { name: "Jane Smith", job: "Marketing Specialist" },
    { name: "Mark Johnson", job: "Sales Associate" },
    { name: "Lucy Brown", job: "Designer" },
    { name: "Peter White", job: "Software Engineer" }
  ];

  const tableBody = document.getElementById("applicationsTable");

  function displayApplications(filter = "") {
    tableBody.innerHTML = "";
    applications
      .filter(app => app.name.toLowerCase().includes(filter.toLowerCase()))
      .forEach(app => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${app.name}</td>
          <td>${app.job}</td>
          <td>
            <button class="view">View</button>
            <button class="accept">Accept</button>
            <button class="decline">Decline</button>
          </td>
        `;
        tableBody.appendChild(tr);
      });
  }

  // Initial display
  displayApplications();

  // Search filter
  document.getElementById("appSearch").addEventListener("input", (e) => {
    displayApplications(e.target.value);
  });