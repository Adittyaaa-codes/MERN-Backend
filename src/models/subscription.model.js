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

const subs = mongoose.model("Subscription",subsSchema)
export default {subs};