import express from 'express'
import {connectToDatabase} from '../utils/mongodb.js'
import { check, validationResult } from 'express-validator'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'


const router = express.Router()
const {db, ObjectId} = await connectToDatabase()
const nomeCollection = 'usuarios'

/* ------------------------------------------ *
 * Validações do usuário 
 * ------------------------------------------ */

const ValidaUsuario = [
    check('nome')
    .not().isEmpty().trim().withMessage('É obrigatório informar o nome')
    .isAlpha('pt-BR', {ignore: ' '}).withMessage('Informe apenas texto')
    .isLength({min:3}).withMessage('Informe no mínimo 3 caracteres')
    .isLength({max: 100}).withMessage('Informe no máximo 100 caracteres'),
    
    check('email')
    .not().isEmpty().trim().withMessage('É obrigatório informar o email')
    .isLowercase().withMessage('Não são permitias maiúsculas')
    .isEmail().withMessage('Informe um email válido')
    .custom((value, {req})=> {
        return db.collection(nomeCollection)
                .find({email: {$eq: value}}).toArray()
                .then((email) => {
                    //verifica se não existe o ID para garantir que é inclusão 
                    if(email.length && !req.params.id){
                        return Promise.reject(`o email ${value} já existe!`)
                    }
                })
    }),

    check('senha')
    .not().isEmpty().trim().withMessage('A senha é obrigatória')
    .isLength({min:6}).withMessage('A senha deve conter no mínimo 6 caracteres')
    .isStrongPassword({
        minLength: 6,
        minLowercase: 1, minUppercase: 1,
        minSymbols: 1, minNumbers: 1
    }).withMessage('A senha não é segura.' + 
    'informe no mínimo 1 caractere maiúsculo, 1 minúsculo, 1 número e 1 caractere especial'),

    check('ativo')
    .default(true)
    .isBoolean().withMessage('O valor deve ser um booleano'),
    
    check('tipo')
    .default('Cliente')
    .isIn(['Admin', 'Cliente']).withMessage('O tipo deve ser Admin ou Cliente'),

    check('avatar')
    .optional({nullable: true})
    .isURL().withMessage('A URL do avatar é inválida')
]

//POST de usuário
router.post('/', ValidaUsuario, async(req, res) => {
    const schemaErrors = validationResult(req)
    if(!schemaErrors.isEmpty()){
        return res.status(403).json({
            errors: schemaErrors.array()
        })
    } else{
     //definindo o avatar default
     req.body.avatar = `https://ui-avatars.com/api/?name=${req.body.nome.replace(/ /g, '+')}&background=F00&color=FFF`
    //criptografia da senha
    //genSalt => impete que 2 senhas iguais tenham resultados iguais
    const salt = await bcrypt.genSalt(10)
    req.body.senha = await bcrypt.hash(req.body.senha, salt)
    //iremos salvar o registro
    await db.collection(nomeCollection)
            .insertOne(req.body)
            .then(result => res.status(201).send(result)) //201->created
            .catch(err => res.status(400).json(err))
    }
})

//GET Usuário
router.get('/', async(req, res)=>{
    try{
        const docs = []
        await db.collection(nomeCollection)
        .find({},{projection: {senha: false}})
        .sort({nome:1})
        .forEach((doc)=>{
            docs.push(doc)
        })
        res.status(200).json(docs)
    }catch(err){
        res.status(500).json({
            message: 'Erro ao obter a listagem dos usuários',
            error: `${err.message}`
        })
    }
})

export default router