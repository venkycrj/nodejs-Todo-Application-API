const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");
app.use(express.json());

let db = null;
const initializeDBAndServer = async () => {
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });
  app.listen(3000, () => {
    console.log("Server Running at http://localhost:3000/");
  });
};
initializeDBAndServer();

//API1

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};
const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;
  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
            SELECT * FROM todo
            WHERE todo LIKE "%${search_q}%"
            AND status = "${status}"
            AND priority = "${priority}";`;
      break;

    case hasPriorityProperty(request.query):
      getTodosQuery = `SELECT * FROM todo
                WHERE todo LIKE "%${search_q}%"
                AND priority = "${priority}";`;
      break;

    case hasStatusProperty(request.query):
      getTodosQuery = `SELECT * FROM todo
            WHERE todo LIKE "%${search_q}%"
            AND status = "${status}";`;

      break;
    default:
      getTodosQuery = `SELECT * FROM todo
            WHERE todo LIKE "%${search_q}%";`;
  }
  data = await db.all(getTodosQuery);
  response.send(data);
});

//API2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const getTodoQuery = `SELECT * FROM todo
        WHERE id = ${todoId};`;

  const todoData = await db.all(getTodoQuery);
  response.send(todoData);
});

//API3
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;

  const postTodoQuery = `INSERT INTO todo(id, todo, priority, status)
        VALUES(${id}, '${todo}', '${priority}', '${status}');`;

  await db.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

//API4
app.put("/todos/:todoId/", async (request, response) => {
  try {
    const { todoId } = request.params;
    const updateColumn = "";
    const requestBody = request.body;

    switch (true) {
      case requestBody.status !== undefined:
        updateColumn = "Status";
        break;
      case requestBody.priority !== undefined:
        updateColumn = "Priority";
        break;
      case requestBody.todo !== undefined:
        updateColumn = "Todo";
        break;
    }
    const previousTodoQuery = `
    SELECT 
        * 
    FROM 
        todo 
    WHERE 
        id ="${todoId}";`;

    const previousTodoData = await db.get(previousTodoQuery);

    const {
      todo = previousTodoData.todo,
      priority = previousTodoData.priority,
      status = previousTodoData.status,
    } = request.body;

    const updateTodoQuery = `
    UPDATE 
        todo
    SET 
        todo = '${todo}',
        priority = '${priority}',
        status = '${status}'
    WHERE 
        id = ${todoId};`;
    await db.run(updateTodoQuery);
    response.send(`${updateColumn} Updated`);
  } catch (e) {
    console.log(`Error: ${e.message}`);
    process.exit(1);
  }
});

//API5

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`;

  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
