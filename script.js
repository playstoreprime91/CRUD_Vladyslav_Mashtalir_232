const $ = id => document.getElementById(id);

const addBtn = $("addBtn");
const todoInput = $("todoInput");
const todoDetails = $("todoDetails");
const todoList = $("todoList");
const pagination = $("pagination");
const errorBox = document.querySelector(".error-message");

let todos = [];
const itemsPerPage = 3;
let currentPage = 1;

/* ===== Load tasks ===== */
loadTodos();

async function loadTodos() {
  try {
    const { data, error } = await supabase
      .from("whattodoapp")
      .select("id, text, details")
      .order("id", { ascending: false });

    if (!error && data) {
      todos = data.map(t => ({
        id: t.id,
        text: t.text,
        details: t.details || ""
      }));
      localStorage.setItem("todos", JSON.stringify(todos));
    } else {
      todos = JSON.parse(localStorage.getItem("todos")) || [];
    }
  } catch {
    todos = JSON.parse(localStorage.getItem("todos")) || [];
  }

  render();
}

/* ===== Add task ===== */
addBtn.onclick = async () => {
  const text = todoInput.value.trim();
  const details = todoDetails.value.trim();

  if (!text) return showError("Enter a task");

  todos.unshift({ text, details });
  localStorage.setItem("todos", JSON.stringify(todos));

  todoInput.value = "";
  todoDetails.value = "";
  currentPage = 1;
  render();

  try {
    const { data, error } = await supabase
      .from("whattodoapp")
      .insert([{ text, details }])
      .select("id, text, details")
      .limit(1);

    if (!error && data?.length) {
      todos[0] = {
        id: data[0].id,
        text: data[0].text,
        details: data[0].details
      };

      localStorage.setItem("todos", JSON.stringify(todos));
      render();
    }

  } catch {
    showError("Saved locally — will sync when online");
  }
};

/* ===== Render ===== */
function render() {
  renderTodos();
  renderPagination();
}

function renderTodos() {
  todoList.innerHTML = "";
  const start = (currentPage - 1) * itemsPerPage;

  todos.slice(start, start + itemsPerPage).forEach((item, i) => {
    const li = document.createElement("li");
    li.className = "todo-item";
    li.innerHTML = `
      <div class="task-block">
        <div class="todo-text">${escapeHtml(item.text)}</div>
        <div class="todo-details">${escapeHtml(item.details || "")}</div>
      </div>

      <div style="margin-top:10px;">
        <button class="edit-btn">Edit</button>
        <button class="delete-btn">Delete</button>
      </div>
    `;

    li.querySelector(".edit-btn").onclick = () => editTask(start + i, li);
    li.querySelector(".delete-btn").onclick = () => deleteTask(start + i);

    todoList.append(li);
  });
}

/* ===== Pagination ===== */
function renderPagination() {
  pagination.innerHTML = "";
  const pages = Math.max(1, Math.ceil(todos.length / itemsPerPage));

  for (let i = 1; i <= pages; i++) {
    const btn = document.createElement("button");
    btn.className = "pagination-btn";
    btn.textContent = i;
    btn.disabled = i === currentPage;
    btn.onclick = () => { currentPage = i; render(); };
    pagination.append(btn);
  }
}

/* ===== Edit ===== */
function editTask(index, li) {
  const item = todos[index];

  li.innerHTML = `
    <input class="todo-input" value="${escapeHtml(item.text)}">
    <input class="todo-input" value="${escapeHtml(item.details)}">

    <button class="save-btn">Save</button>
    <button class="delete-btn">Delete</button>
  `;

  li.querySelector(".save-btn").onclick = async () => {
    const newText = li.querySelectorAll("input")[0].value.trim();
    const newDetails = li.querySelectorAll("input")[1].value.trim();

    if (!newText) return showError("Task cannot be empty");

    const old = item;

    todos[index].text = newText;
    todos[index].details = newDetails;
    localStorage.setItem("todos", JSON.stringify(todos));
    render();

    if (old.id) {
      try {
        await supabase
          .from("whattodoapp")
          .update({ text: newText, details: newDetails })
          .eq("id", old.id);
      } catch {
        showError("Saved locally — will sync when online");
      }
    }
  };

  li.querySelector(".delete-btn").onclick = () => deleteTask(index);
}

/* ===== Delete ===== */
async function deleteTask(index) {
  const removed = todos.splice(index, 1)[0];
  localStorage.setItem("todos", JSON.stringify(todos));

  if ((currentPage - 1) * itemsPerPage >= todos.length)
    currentPage = Math.max(1, currentPage - 1);

  render();

  if (removed.id) {
    try {
      await supabase.from("whattodoapp").delete().eq("id", removed.id);
    } catch {
      showError("Deleted locally — will sync when online");
    }
  }
}

/* ===== Helpers ===== */
function showError(text) {
  errorBox.textContent = text;
  errorBox.style.display = "block";
  setTimeout(() => (errorBox.style.display = "none"), 3000);
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#39;'
  }[c]));
}
