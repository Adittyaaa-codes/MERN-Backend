import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema({
    videoFile:{
        type:String, //url
        required:true,
    },
    thumbnail:{
        type:String, //url
        required:true,
    },
    owner:{
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    title:{
        type:String,
        required: true
    },
    description:{
        type:String,
        default : 'no description'
    },

    duration:{
        type:Number, //from the third party video info
    },
    views:{
        type:Number,
        default:0
    },
    isPublished:{
        type:Boolean,
        default :true
    }
},{timestamps:true});


videoSchema.plugin(mongooseAggregatePaginate)

const Video = mongoose.model("Video", videoSchema);
export default Video;
