const { format, compareAsc } = require("date-fns");
const express = require("express");
app = express();
app.use(express.json());
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at localhost:3000");
    });
  } catch (error) {
    console.log(`DB Error:${error.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();
let c;
const checkDateValidity = async (request, response, next) => {
  const { date } = request.query;

  try {
    c = await format(new Date(`${date}`), "yyyy-MM-dd");
    request.c = c;
    console.log(c);
    next();
  } catch (e) {
    console.log(`${e.message}`);
    response.status(400);
    response.send("Invalid Due Date");
  }
};

const checkPriorityAndStatusAndCategory = (request, response, next) => {
  const {
    search_q = "",
    status = "",
    priority = "",
    category = "",
  } = request.query;

  if (
    priority === "" ||
    priority === "HIGH" ||
    priority === "LOW" ||
    priority === "MEDIUM"
  ) {
    if (
      status === "" ||
      status === "TO DO" ||
      status === "IN PROGRESS" ||
      status === "DONE"
    ) {
      if (
        category === "" ||
        category === "HOME" ||
        category === "WORK" ||
        category === "LEARNING"
      ) {
        request.search_q = search_q;
        request.status = status;
        request.priority = priority;
        request.category = category;
        next();
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
};

const returnTodo = (todo) => {
  return {
    id: todo.id,
    todo: todo.todo,
    priority: todo.priority,
    status: todo.status,
    category: todo.category,
    dueDate: todo.due_date,
  };
};

app.get(
  "/todos/",
  checkPriorityAndStatusAndCategory,
  async (request, response) => {
    const {
      search_q = "",
      status = "",
      priority = "",
      category = "",
    } = request;

    const getTodosQuery = `
    SELECT * FROM todo
    WHERE todo LIKE "%${search_q}%" and category LIKE "%${category}%" and priority LIKE "%${priority}%" and status LIKE "%${status}%";`;
    const todosArray = await db.all(getTodosQuery);
    response.send(todosArray.map((eachTodo) => returnTodo(eachTodo)));
  }
);

app.get("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    SELECT * FROM todo WHERE id=${todoId};`;
  const todo = await db.get(getTodoQuery);
  response.send(returnTodo(todo));
});

app.get("/agenda/", checkDateValidity, async (request, response) => {
  const { c } = request;
  console.log(c);
  const getTodoQuery = `
      SELECT * FROM todo WHERE due_date='${c}';`;
  const todoArray = await db.all(getTodoQuery);
  console.log(todoArray);
  response.send(todoArray.map((eachTodo) => returnTodo(eachTodo)));
});

app.post("/todos", async (request, response) => {
  const { id, todo, category, priority, status, dueDate } = request.body;

  if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "HOME" ||
        category === "WORK" ||
        category === "LEARNING"
      ) {
        console.log("fddfdf");
        const checkDateValid = async () => {
          console.log("fddfdf");
          try {
            c = await format(new Date(`${dueDate}`), "yyyy-MM-dd");
            const createTodoQuery = `
                INSERT INTO todo(id,todo,category,priority,status,due_date)
                VALUES(${id},"${todo}","${category}","${priority}","${status}","${c}");`;
            const createdTodo = await db.run(createTodoQuery);
            response.send("Todo Successfully Added");
          } catch (e) {
            console.log(`${e.message}`);
            response.status(400);
            response.send("Invalid Due Date");
          }
        };
        checkDateValid();
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

app.put("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  console.log(todoId);
  let { status, todo, priority, dueDate, category } = request.body;
  if (status !== undefined) {
    if (status === "DONE" || status === "IN PROGRESS" || status === "TO DO") {
      console.log("drdrdr");
      const updateQuery = `
        UPDATE todo
        SET
        status="${status}"
        WHERE id=${todoId};`;
      const updatedTodo = await db.run(updateQuery);
      response.send("Status Updated");
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  }
  if (priority !== undefined) {
    if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
      const updateQuery = `
        UPDATE todo
        SET
        priority="${priority}"
        WHERE id=${todoId};`;
      const updatedTodo = await db.run(updateQuery);
      response.send("Priority Updated");
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  }

  if (todo !== undefined) {
    const updateQuery = `
        UPDATE todo
        SET
        todo="${todo}"
        WHERE id=${todoId};`;
    const updatedTodo = await db.run(updateQuery);
    response.send("Todo Updated");
  }
  if (category !== undefined) {
    if (category === "WORK" || category === "HOME" || category === "LEARNING") {
      const updateQuery = `
        UPDATE todo
        SET
        category="${category}"
        WHERE id=${todoId};`;
      const updatedTodo = await db.run(updateQuery);
      response.send("Category Updated");
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  }

  if (dueDate !== undefined) {
    const checkDateValid = async () => {
      console.log("fddfdf");
      try {
        c = await format(new Date(`${dueDate}`), "yyyy-MM-dd");
        const updateQuery = `
              UPDATE todo
              SET
              due_date="${dueDate}"
              WHERE id=${todoId};`;
        const updatedTodo = await db.run(updateQuery);
        response.send("Due Date Updated");
      } catch (e) {
        console.log(`${e.message}`);
        response.status(400);
        response.send("Invalid Due Date");
      }
    };
    checkDateValid();
  }
});

app.delete("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  console.log(todoId);
  const deleteQuery = `
    DELETE FROM todo WHERE id=${todoId};`;
  const todo = await db.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
