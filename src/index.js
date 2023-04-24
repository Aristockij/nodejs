const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const depthLimit = require('graphql-depth-limit');
const {createComplexityLimitRule} = require('graphql-validation-complexity');
const { ApolloServer } = require('apollo-server-express');
require('dotenv').config();

//Импортируем локальные модули
const db = require('./db');
const models = require('./models');
const typeDefs = require('./schema');
const resolvers = require('./resolvers');
const jwt = require('jsonwebtoken');

// Запускаем сервер на порте, указанном в файле .env, или на порте 4000
const port = process.env.PORT || 3020;
// Сохраняем значение DB_HOST в виде переменной
const DB_HOST = process.env.DB_HOST;


const app = express();
app.use(helmet());
app.use(cors());
// Подключаем БД
db.connect(DB_HOST);


const getUser = token =>{
    if(token){
        try{
            return jwt.verify(token, process.env.JWT_SECRET);
        }catch(err) {
            new Error('Session invalid');
        }
    }
};

// Настраиваем Apollo Server
const server = new ApolloServer({
    typeDefs,
    resolvers,
    validationRules: [depthLimit(5), createComplexityLimitRule],
    context:({req})=>{
        const token = req.headers.authorization;
        const user = getUser(token);
        // console.log(user);
        return {models, user};
    }
});

server.applyMiddleware({ app, path: '/api' });

app.listen({ port }, () =>
    console.log(
        `GraphQL Server running at http://localhost:${port}${server.graphqlPath}`
    )
);