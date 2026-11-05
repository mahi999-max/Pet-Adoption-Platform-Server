import 'dotenv/config'
import { MongoClient, ObjectId } from 'mongodb';
import express from 'express'
import cors from 'cors'
const client = new MongoClient(process.env.MONGODB_URI);
const app=express()
const port=process.env.PORT || 5000

app.use(cors())
app.use(express.json())

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}

// Call this only when your application terminates
// export async function disconnectFromMongoDB() {
//   await client.close();
// }
  
const database=client.db('pet-adoption-platform')
const PetsCollection=database.collection('allPets')


app.get('/', (req, res) => {
  res.send('Server is running on port ' + port)
})
app.get('/allPets',async(req,res)=>{
    const result=await PetsCollection.find().toArray()
    res.send(result)
})
app.get('/allPets/:id',async(req,res)=>{
    const petId=req.params.id
    const result=await PetsCollection.findOne({
        _id:new ObjectId(petId)
    })
    res.send(result)
})

app.post('/addPet',async(req,res)=>{
    const data=req.body
    const result=await PetsCollection.insertOne(data)
    res.send(result)
})

connectToMongoDB()

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})