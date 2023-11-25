const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 5000;




// middelware

app.use(cors());
app.use(express.json());



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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



        //----------------- all apartment api ------------------------------------ 

        app.get('/apartment', async (req, res) => {
            const result = await apartmentcollection.find().toArray()
            res.send(result)
        })

        // ---------------------------------------------------------------




        // --------------  pending aggrement api ---------------------
        // pending apartment post
        app.post('/agrementapartment', async (req, res) => {
            const pendingItem = req.body;
            const result = await pendingagrecollection.insertOne(pendingItem)
            res.send(result)
        })


        // pending apartment get
        app.get('/agrementapartment', async (req, res) => {
            const result = await pendingagrecollection.find().toArray()
            res.send(result)
        })


        // one pending apartment get
        app.get('/agrementapartment/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await pendingagrecollection.findOne(query);
            res.send(result)
        })

        // update status pending to rejected
        app.put('/agrementapartment/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updatemarks = req.body
            const marks = {
                $set: {
                    status: updatemarks.status,


                }
            }
            const result = await pendingagrecollection.updateOne(filter, marks, options)
            res.send(result);
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
        app.get('/users', async (req, res) => {
            const result = await usercollection.find().toArray()
            res.send(result)
        })

         
        // user update (user to admin) (admin to user)
        app.put('/users/:id', async (req, res) => {
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
        app.post('/announcement', async (req, res) => {
            const allannouncemnt = req.body;
            const result = await announcementcollection.insertOne(allannouncemnt)
            res.send(result)
        })

        // get announcement db to ui
        app.get('/announcement', async (req, res) => {
            const result = await announcementcollection.find().sort({date: 'desc'}).toArray()
            res.send(result)
        })

        // ---------------------------------------

        // --------------------coupon api --------------------------

        // post all coupon
        app.post('/coupon', async (req, res) => {
            const allcoupon = req.body;
            const result = await couponcollection.insertOne(allcoupon)
            res.send(result)
        })

        // get all coupon
        app.get('/coupon', async (req, res) => {
            const result = await couponcollection.find().sort({date: 'desc'}).toArray()
            res.send(result)
        })

        // ----------------------------------------------


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
