/**
 * Testes na API de Prestadores
 * Tecnologias utilizadas:
 * Supertest: Biblioteca para testes na API Rest do NodeJS
 * dotenv: Biblioteca para gerenciar variáveis de ambiente
 */

const request = require('supertest')
const dotenv = require('dotenv')
dotenv.config() //carrega as variáveis do .env

const baseURL = 'http://localhost:4000/api'

describe('API REST de Prestadores sem o Token', ()=>{
    it('GET / - Lista todos os prestadores sem o token', async() =>{
        const response = await request(baseURL)
        .get('/prestadores')
        .set('Content-Type', 'application/json')
        .expect(401) //Unauthorized
    })

    it('GET / - Obtém o Prestador pelo ID sem o token', async()=>{
        const id = '65f8e27d5124fd1767c0dd89'
        const response = await request(baseURL)
        .get(`/prestadores/id/${id}`)
        .set('Content-Type', 'application/json')
        .expect(401)
    })

    it('GET / - Obtém o Prestador pela razão social sem o token', async()=>{
        const razao = 'MARIA'
        const response = await request(baseURL)
        .get(`/prestadores/razao/${razao}`)
        .set('Content-Type', 'application/json')
        .expect(401)
    })
})

describe('API REST de Prestadores com o Token', ()=>{
    let token //Armazenaremos o access_token JWT
    it('POST / - Autenticar usuário para retornar token JWT', async() =>{
        const senha = process.env.SENHA_USUARIO
        const response = await request(baseURL)
        .post('/usuarios/login')
        .set('Content-Type', 'application/json')
        .send({"email":"josealves@uol.com.br", "senha": senha})
        .expect(200) //OK

        token = response.body.access_token
        expect(token).toBeDefined() //Recebemos o token?
    })

    it('GET / - Listar os prestadores com autenticação', async() =>{
        const response = await request(baseURL)
        .get('/prestadores')
        .set('Content-Type', 'application/json')
        .set('access-token', token) //Inclui o token na chamada
        .expect(200)

        const prestadores = response.body
        expect(prestadores).toBeInstanceOf(Array)
    })

    dadosPrestador = {
        "cnpj": "01234567890002",
        "razao_social": "JOSÉ LOPES 2 TRANSPORTES LTDA.",
        "cep": "18110680",
        "endereco":{
            "logradouro": "Av. Pesidente Kennedy, 121",
            "complemento": "",
            "bairro": "Centro",
            "localidade": "Votorantim",
            "uf": "SP"
        },
        "cnae_fiscal": 451510,
        "nome_fantasia": "JOSELOPS",
        "data_inicio_atividade": "2022-07-22",
        "localização": {
            "type": "Point",
            "coordinates": [-23.2904, -47.2963]
        }
    }


    it('POST / - Inclui um novo prestador com autenticação', async()=>{
        const response = await request(baseURL)
        .post('/prestadores')
        .set('Content-Type', 'application/json')
        .set('access-token', token)
        .send(dadosPrestador)
        .expect(201) //created

        expect(response.body).toHaveProperty('acknowledged')
        expect(response.body.acknowledged).toBe(true)

        expect(response.body).toHaveProperty('insertedId')
        expect(typeof response.body.insertedId).toBe('string')
        idPrestadorInserido = response.body.insertedId
        expect(response.body.insertedId.length).toBeGreaterThan(0)
    })

    it('GET /:id - Lista o prestador pelo id com token', async()=>{
        const response = await request(baseURL)
        .get(`/prestadores/id/${idPrestadorInserido}`)
        .set('Content-Type', 'application/json')
        .set('access-token', token)
        .expect(200)
    })

    it('GET /:razao - Lista o prestador pela razão com token', async()=>{
        const response = await request(baseURL)
        .get(`/prestadores/razao/${dadosPrestador.razao_social}`)
        .set('Content-Type', 'application/json')
        .set('access-token', token)
        .expect(200)
    })
})