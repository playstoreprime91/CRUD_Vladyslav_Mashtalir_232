const $ = id => document.getElementById(id);

const addBtn = $("addBtn");
const todoInput = $("todoInput");
const todoDesc = $("todoDesc");
const todoDeadline = $("todoDeadline");
const todoList = $("todoList");
const pagination = $("pagination");
const errorBox = document.querySelector(".error-message");

let todos = [];
const itemsPerPage = 3;
let currentPage = 1;

/* ===== Load Todos ===== */
loadTodos();

async function loadTodos() {
  try {
    const { data, error } = await supabase
      .from("whattodoapp")
      .select("id, text, description, deadline")
      .order("id", { ascending: false });

    if (!error && data) {
      todos = data;
      localStorage.setItem("todos", JSON.stringify(todos));
    }
  } catch (e) {
    todos = JSON.parse(localStorage.getItem("todos")) || [];
  }

  render();
}

/* ===== Add Task ===== */
addBtn.onclick = async () => {
  const text = todoInput.value.trim();
  const description = todoDesc.value.trim();
  const deadline = todoDeadline.value || null;

  if (!text) return showError("Enter task title");

  const newTask = { text, description, deadline };

  todos.unshift(newTask);
  localStorage.setItem("todos", JSON.stringify(todos));

  todoInput.value = "";
  todoDesc.value = "";
  todoDeadline.value = "";

  currentPage = 1;
  render();

  try {
    const { data, error } = await supabase
      .from("whattodoapp")
      .insert([newTask])
      .select();

    if (!error && data?.length) {
      todos[0] = data[0];
      localStorage.setItem("todos", JSON.stringify(todos));
      render();
    }
  } catch (e) {
    showError("Saved locally — will sync later");
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
      <div class="todo-text">
        <strong>${escapeHtml(item.text)}</strong><br>
        <small>${escapeHtml(item.description || "")}</small><br>
        <small>📅 ${item.deadline || "No date"}</small>
      </div>

      <button class="edit-btn">Edit</button>
      <button class="delete-btn">Delete</button>
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

/* ===== Edit Task ===== */
function editTask(index, li) {
  const item = todos[index];

  li.innerHTML = `
    <input class="todo-text" value="${escapeHtml(item.text)}">
    <input class="todo-text" value="${escapeHtml(item.description || "")}">
    <input type="date" class="todo-text" value="${item.deadline || ""}">
    <button class="save-btn">Save</button>
    <button class="delete-btn">Delete</button>
  `;

  li.querySelector(".save-btn").onclick = async () => {
    const title = li.querySelectorAll("input")[0].value.trim();
    const desc = li.querySelectorAll("input")[1].value.trim();
    const date = li.querySelectorAll("input")[2].value;

    if (!title) return showError("Title required");

    const old = item;

    todos[index].text = title;
    todos[index].description = desc;
    todos[index].deadline = date;

    localStorage.setItem("todos", JSON.stringify(todos));
    render();

    if (old.id) {
      await supabase
        .from("whattodoapp")
        .update({ text: title, description: desc, deadline: date })
        .eq("id", old.id);
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
    await supabase.from("whattodoapp").delete().eq("id", removed.id);
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
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}
