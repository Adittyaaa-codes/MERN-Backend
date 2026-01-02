import mongoose, {Schema} from "mongoose";

const subsSchema = new Schema({
    subscriber:{
        type:Schema.Types.ObjectId,
        ref:"User"
    },
    channel:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }
},{timestamps:true});

subsSchema.index(
  { subscriber: 1, channel: 1 },
  { unique: true }
);

const Subscription = mongoose.model("Subscription",subsSchema)
export default Subscription;