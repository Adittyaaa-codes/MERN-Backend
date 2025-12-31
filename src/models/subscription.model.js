import mongoose, {Schema} from "mongoose";

const subsSchema = new Schema({
    subscriber:{
        type:Schema.Types.ObjectId,
        ref:"User"
    },
    subscribedTo:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }
},{timestamps:true});

subsSchema.index(
  { subscriber: 1, subscribedTo: 1 },
  { unique: true }
);

const Subscription = mongoose.model("Subscription",subsSchema)
export default Subscription;