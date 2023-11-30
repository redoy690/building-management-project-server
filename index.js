const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');



// middelware

app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gfjtqgg.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {

        const apartmentcollection = client.db('buildingDb').collection('apartment')
        const pendingagrecollection = client.db('buildingDb').collection('pendingagrement')
        const usercollection = client.db('buildingDb').collection('users')
        const announcementcollection = client.db('buildingDb').collection('announcement')
        const couponcollection = client.db('buildingDb').collection('coupon')
        const paymentcollection = client.db('buildingDb').collection('payment')




        //  ----------------middle ware verify token ---------------------------

        app.post('/jwt', async (req, res) => {
            const user = req.body
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1h'
            })
            res.send({ token })
        })


        const verifytoken = (req, res, next) => {
            console.log('inside verify token', req.headers)
            if (!req.headers.authorization) {
                return res.status(401).send({ message: 'unauthorized access' })
            }
            const token = req.headers.authorization.split(' ')[1];
            console.log(process.env.ACCESS_TOKEN_SECRET)
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
                if (error) {
                    return res.status(401).send({ message: 'forbidden access' })
                }
                req.decoded = decoded;
                next()
            })

        }


        const verifyAdmin = (async (req, res, next) => {
            const email = req.decoded.email
            const query = { email: email };
            const user = await usercollection.findOne(query)
            const isAdmin = user?.role === 'admin';
            if (!isAdmin) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            next()
        })


        const verifyMember = (async (req, res, next) => {
            const email = req.decoded.email
            const query = { email: email };
            const user = await usercollection.findOne(query)
            const isAdmin = user?.role === 'member';
            if (!isAdmin) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            next()
        })






        app.get('/user/admin/:email', verifytoken, async (req, res) => {
            const email = req.params.email;
            if (email !== req.decoded.email) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            const query = { email: email }
            const user = await usercollection.findOne(query)
            let admin = false;
            if (user) {
                admin = user?.role == 'admin';
            }

            res.send({ admin })
        })

        app.get('/user/member/:email', verifytoken, async (req, res) => {
            const email = req.params.email;
            if (email !== req.decoded.email) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            const query = { email: email }
            const user = await usercollection.findOne(query)
            let member = false;
            if (user) {
                member = user?.role == 'member';
            }

            res.send({ member })
        })

        app.get('/user/user/:email', verifytoken, async (req, res) => {
            const email = req.params.email;
            if (email !== req.decoded.email) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            const query = { email: email }
            const user = await usercollection.findOne(query)
            let users = false;
            if (user) {
                users = user?.role == 'user';
            }

            res.send({ users })
        })




        // ---------------------------------

    




        // --------------  pending aggrement api ---------------------
        // pending apartment post
        app.post('/agrementapartment',verifytoken, async (req, res) => {
            const pendingItem = req.body;
           
            const result = await pendingagrecollection.insertOne(pendingItem)
            res.send(result)
        })


        // pending apartment get
        app.get('/agrementapartment', async (req, res) => {
            const result = await pendingagrecollection.find().sort({ date: 'desc' }).toArray()
            res.send(result)
        })


        // one pending apartment get
        app.get('/agrementapartment/:id',verifytoken, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await pendingagrecollection.findOne(query);
            res.send(result)
        })

        // update status pending to rejected
        app.put('/agrementapartment/:id',verifytoken, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updatemarks = req.body
            const marks = {
                $set: {
                    status: updatemarks.status,
                    acceptdate: updatemarks.acceptdate

                }
            }
            const result = await pendingagrecollection.updateOne(filter, marks, options)
            res.send(result);
        })


        // delete pending post
        app.delete('/agrementapartment/:id',verifytoken, async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const coupon = await pendingagrecollection.deleteOne(query)
            res.send(coupon)
        })
        // --------------------------------------------

        // ------------------user api ---------------------
        // post users ui to db
        app.post('/users', async (req, res) => {
            const user = req.body;
            const query = { email: user.email }
            const existingUser = await usercollection.findOne(query)
            if (existingUser) {
                return res.send({ message: 'user already exiteds', insertedId: null })
            }
            const result = await usercollection.insertOne(user)
            res.send(result)
        })




        // get all users from db
        app.get('/users',verifytoken, async (req, res) => {

            const result = await usercollection.find().toArray()
            res.send(result)
        })


        // user update (user to admin) (admin to user)
        app.put('/users/:id',verifytoken, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updateusers = req.body
            const userrole = {
                $set: {
                    role: updateusers.role,


                }
            }
            const result = await usercollection.updateOne(filter, userrole, options)
            res.send(result);
        })


        // ---------------------------------------

        //  -------------- announcement api --------------------------------

        // new announcement post ui to db
        app.post('/announcement',verifytoken,verifyAdmin, async (req, res) => {
            const allannouncemnt = req.body;
            const result = await announcementcollection.insertOne(allannouncemnt)
            res.send(result)
        })

        // get announcement db to ui
        app.get('/announcement',verifytoken, async (req, res) => {
            const result = await announcementcollection.find().sort({ date: 'desc' }).toArray()
            res.send(result)
        })

        // ---------------------------------------

        // --------------------coupon api --------------------------

        // post all coupon
        app.post('/coupon',verifytoken,verifyAdmin, async (req, res) => {
            const allcoupon = req.body;
            const result = await couponcollection.insertOne(allcoupon)
            res.send(result)
        })

        // get all coupon
        app.get('/coupon', async (req, res) => {
            const result = await couponcollection.find().sort({ date: 'desc' }).toArray()
            res.send(result)
        })

        app.delete('/coupon/:id',verifytoken,verifyAdmin, async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const coupon = await couponcollection.deleteOne(query)
            res.send(coupon)
        })

        // ----------------------------------------------

        // --------------- payment api -----------------
        app.post('/create-payment-intent', async (req, res) => {
            const { price } = req.body
            const amount = parseInt(price * 100)
            console.log(amount, 'amount is the intent')

            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: "usd",
                payment_method_types: ['card']

            })
            res.send({
                clientSecret: paymentIntent.client_secret
            })
        })

        app.get('/payments', verifytoken, async (req, res) => {
            const result = await paymentcollection.find().sort({ paymentdate: 'desc' }).toArray()
            res.send(result)
        })

        app.post('/payments', verifytoken, async (req, res) => {
            const paymentconfirm = req.body;
            const result = await paymentcollection.insertOne(paymentconfirm)
            res.send(result)
        })


        app.get('/payments/:email',verifytoken, async (req, res) => {
            const query = { email: req.params.email }
            const result = await paymentcollection.find(query).sort({ paymentdate: 'desc' }).toArray()
            res.send(result)
        })
        // --------------------------------------


        //  ---------------all apartment and pagination api ---------------------

        app.post('/allapartment',verifytoken,verifyAdmin, async (req, res) => {
            const newapartment = req.body;
            const result = await apartmentcollection.insertOne(newapartment)
            res.send(result)
        })

        app.get('/allapartment', async (req, res) => {
            const result = await apartmentcollection.find().sort().toArray()
            res.send(result)
        })

        app.delete('/apartment/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const coupon = await apartmentcollection.deleteOne(query)
            res.send(coupon)
        })

        app.get('/apartmentcount', async (req, res) => {
            const count = await apartmentcollection.estimatedDocumentCount()
            res.send({ count })
        })


        app.get('/apartment', async (req, res) => {
            console.log('pagination', req.query)
            const page = parseInt(req.query.page)
            const size = parseInt(req.query.size)
            const result = await apartmentcollection.find()
                .skip(page * size)
                .limit(size)
                .toArray()
            res.send(result)
        })


        // -----------------------------------------------------


        // ----------- jwt api -------------------------------






        // ------------------------------------------------------

        // Send a ping to confirm a successful connection
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);






app.get('/', (req, res) => {
    res.send('building is running')
})

app.listen(port, () => {
    console.log(`building server is running on port :${port}`)
})
