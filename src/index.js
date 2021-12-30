const express = require("express");
//Gera um id random
const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(express.json());

const clientes = [];

//Outra forma de usar o Middleware (Dessa forma o app.use aplica para todas as rotas que está abaixo dele)
//app.use(verificaCpfExistente);

//Middleware - Validações e verificações
function verificaCpfExistente(request, response, next) {
    const { cpf } = request.params;

    //Verifica se há cliente com um CPF existente
    const cliente = clientes.find(cliente => cliente.cpf === cpf);

    //Checa se há cliente cadastrado
    if (!cliente) {
        return response.status(400).json({ erro: "Cliente não encontrado!" })
    }

    request.cliente = cliente;

    return next();
};

//Pega o saldo atual e verifica se há saldo suficiente
function saldoAtual(extrato) {
    const balanco = extrato.reduce((acumulador, operacao) => {
        if (operacao.tipo === "credito") {
            return acumulador + operacao.valor;
        } else {
            return acumulador - operacao.valor;
        }
    }, 0)
    return balanco;

};

//Cria novo cliente e valida
app.post("/conta", (request, response) => {
    const { cpf, nome } = request.body;

    //Validando CPF
    const clienteExistente = clientes.some((cliente) => cliente.cpf === cpf);

    if (clienteExistente) {
        return response.status(400).json({ erro: "Cliente já cadastrado!" })
    }

    //Insere dados dentro do Array (lista)
    clientes.push({
        cpf,
        nome,
        id: uuidv4(),
        extrato: [],
    });
    return response.status(201).json({ sucesso: "Cliente cadastrado com sucesso!" }).send();
});

//Verifica o extrato do cliente (O Middleware no meio faz uma verificação nesse única rota)
app.get("/extrato", verificaCpfExistente, (request, response) => {
    //Chamando a partir do Middleware
    const { cliente } = request;

    return response.json(cliente.extrato);
});

//Ferramenta de depósito
app.post("/deposito", verificaCpfExistente, (request, response) => {
    //Argumentos principais
    const { valor, descricao } = request.body;
    //De onde ele tá pegando o cliente
    const { cliente } = request;
    //Função de depósito
    const extratoOperacao = {
        descricao,
        valor,
        dataCriacao: new Date(),
        tipo: "credito"
    }
    cliente.extrato.push(extratoOperacao);
    return response.status(201).send();

});

//Ferramenta de saque
app.post("/saque", verificaCpfExistente, (request, response) => {
    const { valor } = request.body;
    const { cliente } = request;

    const balanco = saldoAtual(cliente.extrato);

    if (balanco < valor) {
        return response.status(400).json({ erro: "Saldo insuficiente!" })
    }

    const extratoOperacao = {
        valor,
        dataCriacao: new Date(),
        tipo: "debito"
    };

    cliente.extrato.push(extratoOperacao);

    return response.status(201).json({ sucesso: "Saque efetuado com sucesso" }).send();
});

//Busca extrato por data
app.get("/extrato/date", verificaCpfExistente, (request, response) => {
    //Chamando a partir do Middleware
    const { cliente } = request;
    const { date } = request.query;

    const dateFormat = new Date(date + " 00:00");

    const extrato = cliente.extrato.filter(
        (extrato) =>
            extrato.dataCriacao.toDateString() ===
            new Date(dateFormat).toDateString()
    );

    return response.json(extrato);
});

//Atualiza dados da conta
app.put("/conta", verificaCpfExistente, (request, response) => {
    const { nome } = request.body;
    const { cliente } = request;

    cliente.nome = nome;

    return response.status(201).json({ sucesso: "Dados alterados com sucesso!" }).send();

});

//Retorna os informações atuais da conta
app.get("/conta", verificaCpfExistente, (request, response) => {
    const { cliente } = request;

    return response.json(cliente);

});

//Excluir conta
app.delete("/conta", verificaCpfExistente, (request, response) => {
    const { cliente } = request;

    clientes.splice(cliente, 1);

    return response.status(200).json(clientes);


});




//LocalHost: Portas
app.listen(3333);