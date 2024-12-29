import express from "express"
import cors from "cors"
import 'dotenv/config'
import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";

const app = express();
const port = process.env.PORT || 5000

app.use(express.json())
app.use(cors())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rvz6g.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

        
        const queriesCollection = client.db("Ask-me").collection("queries") ;
        const recommendationCollection = client.db("Ask-me").collection("recommendation") ;


    //   Get Queries

        app.get("/queries" , async (req , res) => {
            const email = req.query.email ; 
            let query = {} ;
            if(email){
                query = {"author.email" : email}
            }
            const cursor = queriesCollection.find(query).sort({createdAt : -1}) ;
            const result = await cursor.toArray() ;
            res.send(result) ; 
        })

        // get all of my recommendation  

        app.get("/recommendation" , async (req , res) => {
            const email = req.query.email ; 
            const filter = { recommendersEmail : email} ; 
            const result = await recommendationCollection.find(filter).sort({createdAt : -1}).toArray();
            res.send(result) ;
        })

        // get recommended for me 

        app.get("/recommendation/forMe" , async (req , res) => {
            const email = req.query.email ; 
            const filter = {queryAuthorEmail : email} ;
            const result = await recommendationCollection.find(filter).sort({createdAt : -1}).toArray();
            res.send(result) ;
        })

    //   get recommendation for a single asked query

    app.get("/recommendation/query/:queryID" ,  async (req , res ) => {
        const query_ID = req.params.queryID ;
        const filter = {queryID : query_ID} ;
        const result = await recommendationCollection.find(filter).sort({createdAt : -1}).toArray() ;
        res.send(result)
    })

    // Get Details of specific Query

    app.get("/queries/:id" , async (req , res) => {
        const id = req.params.id ;
        const filter = {_id : new ObjectId(id)} ; 
        const result = await queriesCollection.findOne(filter) ;
        res.send(result) ; 
    } )

    // post a Query
        app.post("/queries" , async (req , res) => {
            const newQuery = {...req.body , createdAt : new Date()} ;
            const result = await queriesCollection.insertOne(newQuery); 
            res.send(result)
        })

        // update a query 
        
        app.put("/queries/:id" , async (req , res) => {
            const id = req.params.id ; 
            const filter = {_id : new ObjectId(id)} ;
            const options = {upsert : true} ;
            const updatedQuery = req.body ; 
            const query = {
                $set : {
                     title : updatedQuery.title ,
                     product : updatedQuery.product,
                     brand : updatedQuery.brand ,
                     productImage : updatedQuery.productImage ,
                     reason : updatedQuery.reason
                }
            }  

            const result = await queriesCollection.updateOne(filter , query , options) ;
            res.send(result)
        })

        //  delete my Query

        app.delete("/queries/:id" , async (req , res) => {
            const id = req.params.id ;  
            const filter = {_id : new ObjectId(id)} ;
            const result = await queriesCollection.deleteOne(filter) ; 
            res.send(result) ;
        })


    //    post a recommendation

        app.post("/recommendation" , async (req , res) => {
            const newRecommendation = {...req.body , createdAt : new Date()} ;
            const result = await recommendationCollection.insertOne(newRecommendation); 
            const id = newRecommendation.queryID ; 
            const filter = {_id : new ObjectId(id) } ;
            const fetchedQuery = await queriesCollection.findOne(filter) ;
            let newCount = fetchedQuery.recommendCount + 1 ; 
            const query = {_id : new ObjectId(id) } ;
            const updatedQuery = {
                $set : {
                    recommendCount : newCount
                }
            }

            const updatedResult = await queriesCollection.updateOne( query , updatedQuery)
            res.send(result)
        })

   //   delete a recommendation 

        

        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");

        
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get("/", (req, res) => {
    res.send("ask me anything and i will answer it")
})

app.listen(port, () => {
    console.log(`Query incoming ${port}`);
})