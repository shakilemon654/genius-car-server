const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());
require('dotenv').config();

const username = process.env.DB_USERNAME;
const password = process.env.DB_PASSWORD;
const secretKey = process.env.ACCESS_TOKEN_SECRET;

const uri = `mongodb+srv://${username}:${password}@cluster0.wkkprzy.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const verifyJWT = (req, res, next) => {
    const jwtToken = req.headers.authorization.split(' ')[1];
    
    if (jwtToken == 'null') {
        res.status(401).send({ errorMessage: 'Unauthorized access' });
        console.log('Inside', 'No JWT');
    }

    jwt.verify(jwtToken, secretKey, (error, decoded) => {
        if (error) {
            res.status(401).send({ errorMessage: 'Unauthorized access' });
        } else {
            req.decoded = decoded;
            next();
        }
    })
}

async function run() {
    try {
        const database = client.db('geniusCarDB');
        const serviceCollection = database.collection('services');
        const productCollection = database.collection('products');
        const orderCollection = database.collection('orders');

        //JWT
        app.post('/jwt', (req, res) => {
            const userInfo = req.body;
            console.log(userInfo);
            const jwtToken = jwt.sign(userInfo, secretKey, { expiresIn: '1h' });
            res.send({ jwtToken });
        })

        app.get('/', (req, res) => {
            res.send('Server is running');

        })

        // Services API
        app.get('/services', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        })

        app.get('/services/:_id', async (req, res) => {
            const query = { _id: new ObjectId(req.params._id) };
            const service = await serviceCollection.findOne(query);
            res.send(service);
        })

        // Products
        app.get('/products', async (req, res) => {
            const query = {};
            const cursor = productCollection.find(query);
            const products = await cursor.toArray();
            res.send(products);
        })

        // Orders API
        app.get('/orders', verifyJWT, async (req, res) => {
            const decoded = req.decoded;
            if (req.query.email && req.query.email === decoded.email) {
                const query = { email: req.query.email };
                const cursor = orderCollection.find(query);
                const orders = await cursor.toArray();
                res.send(orders);
            } else {
                res.status(403).send({ errorMessage: 'Unauthorized access /orders root' });
            }

        })

        app.post('/orders', async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result);
        })

        app.delete('/orders/:orderID', async (req, res) => {
            const id = req.params.orderID;
            const query = { _id: new ObjectId(id) };
            const result = await orderCollection.deleteOne(query);
            res.send(result);
        })

    } finally {

    }
}
run().catch(console.dir);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});