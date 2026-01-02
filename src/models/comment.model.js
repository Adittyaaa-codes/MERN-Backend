import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new Schema(
    {
        content: {
            type: String,
            required: true
        },
        video: { // on which video
            type: Schema.Types.ObjectId,
            ref: "Video"
        },
        post:{
            type:Schema.Types.ObjectId,
            ref: "Post"
        },
        reply:{
            type:Schema.Types.ObjectId,
            ref: "Comment"
        },
        like:{
            type:Schema.Types.ObjectId,
            ref:"Like"
        },
        owner: { // the person who commented
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    },
    {
        timestamps: true
    }
)


commentSchema.plugin(mongooseAggregatePaginate)

export const Comment = mongoose.model("Comment", commentSchema)