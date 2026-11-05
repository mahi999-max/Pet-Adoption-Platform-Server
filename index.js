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
const adoptRequestCollection=database.collection('requestedPets')


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

app.get('/myListings',async(req,res)=>{
    const ownerEmail=req.query.ownerEmail
    const query={ownerEmail: ownerEmail }
    // if(ownerEmail){
    //     query.ownerEmail=ownerEmail
    // }
    const result=await PetsCollection.find(query).toArray()
    res.send(result)
})
app.patch('/myListings/:id', async (req, res) => {
    const id = req.params.id;
    const updatedData = req.body;

    const result = await PetsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData }
    );

    res.send(result);
});
app.delete('/myListings/:id', async (req, res) => {
    const id = req.params.id;

    const result = await PetsCollection.deleteOne({
        _id: new ObjectId(id)
    });

    res.send(result);
});

app.post('/adoptRequest',async(req,res)=>{
    const {petId, requesterEmail}=await req.body
    const pet=await PetsCollection.findOne({
     _id:new ObjectId(petId)
    })
    if(!pet){
      return res.status(404).send({
        message:'Pet not found'
      })
    }
    if(pet.ownerEmail===requesterEmail){
        return res.status(403).send({
            message: "You cannot buy your own pet"
        })
    }

    const existingRequest=await adoptRequestCollection.findOne({
        petId:petId,
        requesterEmail: requesterEmail,
        status:'pending'
    })
    if(existingRequest){
        return res.status(409).send({
           message:'You already requested for adopt'
        })
    }

    const requestData={
        petId:petId,
        petName:pet.petName,
        petSpecies:pet.species,
        petImage:pet.imageUrl,
        ownerEmail:pet.ownerEmail,
        requesterEmail:requesterEmail,
        status:'pending',
        requestDate:new Date()
    }
    const result=await adoptRequestCollection.insertOne(requestData)
    res.send(result)

})

app.get("/myAdoptRequests", async (req, res) => {
  try {
    const { requesterEmail } = req.query;
    if (!requesterEmail) return res.status(400).send({ message: "requesterEmail is required" });

    const requests = await adoptRequestCollection
      .find({ requesterEmail, status: "pending" })
      .project({ petId: 1, _id: 0 })
      .toArray();

    res.send(requests.map((r) => r.petId));
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Failed to load requests" });
  }
});

app.get("/myRequests", async (req, res) => {
  try {
    const { requesterEmail } = req.query;
    if (!requesterEmail) return res.status(400).send({ message: "requesterEmail is required" });

    const requests = await adoptRequestCollection
      .find({ requesterEmail })
      .sort({ requestDate: -1 })
      .toArray();

    res.send(requests);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Failed to load requests" });
  }
});


connectToMongoDB()

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})