const express = require('express');
const app = express();
const http = require('http');
const mysql = require('mysql2');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Verifica se a pasta uploads/ existe
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
    console.log('Pasta uploads/ criada com sucesso!');
}

// Configuração do banco de dados
const conexao = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Meliodas23!',
    database: 'pharma'
});

// Teste de conexão com o banco de dados
conexao.connect(function (erro) {
    if (erro) throw erro;
    console.log('Conexão com o banco de dados estabelecida!');
});

// Middleware para processar dados JSON e formulários
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração para servir arquivos estáticos da pasta uploads/
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configuração do Multer para upload de imagens
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Diretório onde as imagens serão salvas
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + '-' + file.originalname;
        cb(null, uniqueName); // Nome único para evitar conflitos
    }
});
const upload = multer({ storage: storage });

// Endpoint para upload de imagem
app.post('/upload', upload.single('imagem'), (req, res) => {
    const imagemPath = `/uploads/${req.file.filename}`; // Caminho da imagem
    const descricao = req.body.descricao; // Descrição da imagem

    // Salva no banco de dados
    const sql = 'INSERT INTO imagens (caminho, descricao) VALUES (?, ?)';
    conexao.query(sql, [imagemPath, descricao], (erro, resultado) => {
        if (erro) {
            console.error('Erro ao salvar no banco de dados:', erro);
            return res.status(500).send('Erro ao salvar no banco de dados.');
        }

        // Após salvar, redireciona para a página de exibição
        res.redirect('/exibir');
    });
});

// Endpoint para exibir a página de upload
app.get('/upload', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Upload de Imagem</title>
        </head>
        <body>
            <h1>Upload de Imagem</h1>
            <form action="/upload" method="POST" enctype="multipart/form-data">
                <label for="descricao">Descrição:</label>
                <input type="text" id="descricao" name="descricao" placeholder="Descrição da imagem" required>
                <br><br>
                <label for="imagem">Escolha uma imagem:</label>
                <input type="file" id="imagem" name="imagem" accept="image/*" required>
                <br><br>
                <button type="submit">Enviar</button>
            </form>
        </body>
        </html>
    `);
});

// Endpoint para exibir todas as imagens salvas
app.get('/exibir', (req, res) => {
    const sql = 'SELECT * FROM imagens'; // Busca todas as imagens no banco

    conexao.query(sql, (erro, resultado) => {
        if (erro) {
            console.error('Erro ao buscar imagens:', erro);
            return res.status(500).send('Erro ao buscar imagens.');
        }

        if (resultado.length === 0) {
            return res.send('Ainda não há imagens enviadas.');
        }

        // Exibe todas as imagens na página
        let imagensHTML = resultado.map(imagem => {
            return `<div style="display: inline-block; margin: 10px;">
                        <img src="${imagem.caminho}" alt="Imagem enviada" style="max-width: 200px;"/>
                        <p><strong>Descrição:</strong> ${imagem.descricao}</p>
                    </div>`;
        }).join('');

        res.send(`
            <h1>Imagens Enviadas</h1>
            <div style="display: flex; flex-wrap: wrap;">
                ${imagensHTML}
            </div>
            <br>
            <a href="/upload">Enviar outra imagem</a>
        `);
    });
});

// Configuração do servidor HTTP
const PORT = 3000;

// Inicialização do servidor
const server = http.createServer(app);

server.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
