import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  text: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  video: { type: mongoose.Schema.Types.ObjectId, ref: "Video", required: true },
}, { timestamps: true });

export default mongoose.model("Comment", commentSchema);


