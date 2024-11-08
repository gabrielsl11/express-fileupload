// Importação dos módulos
import express from "express";
import { engine } from "express-handlebars";
import fileUpload from "express-fileupload";
import mysql from "mysql2";
import path from "path";
import fs from "fs";

// Criação da aplicação
var app = express();

// Conexão com o banco de dados
var conn = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "1234",
  database: "test",
});

// Teste de conexão com o banco de dados
conn.connect((err) => {
  if (err) {
    console.log(`Error: ${err}`);
  } else {
    console.log(`Database ${conn.config.database} connected!`);
  }
});

// Configuração do motor de renderização
app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", "./views");

// Serviço de arquivos estáticos
app.use(express.static("assets"));

// Serviço de arquivos estáticos (imagens)
app.use("/images", express.static("./images"));

// Manipulação dos dados enviados por formulários via POST
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Habilitação do envio de arquivos via POST
app.use(fileUpload());

// Rota principal
app.get("/", (req, res) => {
  let sql = "SELECT * FROM files";
  conn.query(sql, (err, results) => {
    if (err) {
      console.log(`Error: ${err}`);
    } else {
      res.render("index", {
        title: "Express File Upload",
        files: results,
      });
    }
  });
});

// Rota principal (POST)
app.post("/", (req, res) => {
  let name = req.body.name;
  let image = req.files.image.name;

  let sql = `INSERT INTO files (name, image) VALUES (?, ?)`;

  conn.execute(sql, [name, image], (err, result) => {
    if (err) {
      console.log(`Error: ${err}`);
    } else {
      // Move o arquivo para a pasta "images"
      req.files.image.mv(path.resolve("images", image));

      res.redirect("/");
    }
  });
});

// Rota para exclusão de arquivos
app.get("/delete/:id&:image", (req, res) => {
  let sql = "DELETE FROM files WHERE id = ?";

  conn.execute(sql, [req.params.id], (err, result) => {
    if (err) {
      console.log(`Error: ${err}`);
    } else {
      // Remove o arquivo da pasta "images"
      fs.unlink(path.resolve("images", req.params.image), (errImg) => {
        if (errImg) {
          console.log(`Error: ${errImg}`);
        } else {
          res.redirect("/");
        }
      });
    }
  });
});

// Rota para edição de arquivos
app.get("/update/:id", (req, res) => {
  let sql = "SELECT * FROM files WHERE id = ?";

  conn.query(sql, [req.params.id], (err, results) => {
    if (err) {
      console.log(`Error: ${err}`);
    } else {
      res.render("update", {
        file: results[0],
      });
    }
  });
});

// Rota para edição de arquivos (POST)
app.post("/update", (req, res) => {
  let id = req.body.id;
  let name = req.body.name;
  let image = req.files.image.name;

  let sql = `UPDATE files SET name = ?, image = ? WHERE id = ?`;

  conn.execute(sql, [name, image, id], (err, result) => {
    if (err) {
      console.log(`Error: ${err}`);
    } else {
      // Move o arquivo para a pasta "images"
      if (req.files.image) {
        req.files.image.mv(path.resolve("images", image));
      }

      res.redirect("/");
    }
  });
});

// Inicialização do servidor
var PORT = 8080;
app.listen(PORT, (err) => {
  if (err) {
    console.log(`Error: ${err}`);
  } else {
    console.log(`Server is running on http://localhost:${PORT}`);
  }
});
