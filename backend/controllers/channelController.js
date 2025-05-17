import Channel from "../models/Channel.js";
import Video from "../models/Video.js";
import User from "../models/User.js";
import Comment from "../models/Comment.js";
import {
  uploadChanelBannerToCloudinary,
  cloudinary,
} from "../config/cloudinary.js";
import { nanoid } from "nanoid";

export const createChannel = async (req, res) => {
  try {
    // ✅ Check if a channel already exists for this user
    const existingChannel = await Channel.findOne({ owner: req.user._id });
    if (existingChannel) {
      return res.status(400).json({ message: "You already have a channel." });
    }

    let channelBanner = null;
    let bannerPublicId = null;

    // ✅ Upload banner if provided
    if (req.file) {
      try {
        const result = await uploadChanelBannerToCloudinary(req.file.buffer);
        channelBanner = result.secure_url;
        bannerPublicId = result.public_id; // ✅ store public_id for later deletion
      } catch (uploadErr) {
        console.error("Cloudinary Upload Error:", uploadErr);
        return res
          .status(500)
          .json({ message: "Failed to upload banner image" });
      }
    }

    // ✅ Create new channel with banner URL + publicId
    const newChannel = new Channel({
      channelId: nanoid(12),
      channelName: req.body.channelName,
      description: req.body.description,
      channelBanner,
      bannerPublicId,
      owner: req.user._id,
    });

    const savedChannel = await newChannel.save();

    // ✅ Optionally, store channel reference in user document
    await User.findByIdAndUpdate(
      req.user._id,
      { $push: { channels: savedChannel._id } },
      { new: true }
    );

    // ✅ Send response and exit
    return res.status(201).json(savedChannel);
  } catch (err) {
    console.error("Error in createChannel:", err);
    return res
      .status(500)
      .json({ error: err.message || "Failed to create channel" });
  }
};

// GET CHANNEL
// GET CHANNEL with its videos
export const getChannel = async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id);
    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    // Fetch videos linked to this channel
    const videos = await Video.find({ channel: channel._id });

    res.json({ channel, videos });
  } catch (err) {
    console.error("Error in getChannel:", err.message);
    res.status(500).json({ error: "Error fetching channel" });
  }
};

// UPDATE CHANNEL

export const updateChannel = async (req, res) => {
  try {
    const channelId = req.params.id;
    const userId = req.user._id;

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    if (channel.owner.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "You are not authorized to update this channel" });
    }

    const { channelName, description } = req.body;

    // If a new banner is uploaded
    if (req.file) {
      // Delete old banner from Cloudinary if exists
      if (channel.bannerPublicId) {
        await cloudinary.uploader.destroy(channel.bannerPublicId);
      }

      // Upload new banner
      const result = await uploadChanelBannerToCloudinary(req.file.buffer);
      channel.channelBanner = result.secure_url;
      channel.bannerPublicId = result.public_id;
    }

    if (channelName) channel.channelName = channelName;
    if (description) channel.description = description;

    await channel.save();
    res.status(200).json(channel);
  } catch (err) {
    console.error("Error updating channel:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// DELETE CHANNEL + its videos + related comments

export const deleteChannel = async (req, res) => {
  try {
    const channelId = req.params.id;
    const userId = req.user._id;

    // Fetch channel from DB
    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    // Check if the logged-in user is the owner of the channel
    if (!channel.owner.equals(userId)) {
      return res
        .status(403)
        .json({ message: "Unauthorized to delete this channel" });
    }

    // Delete all comments associated with the channel's videos
    const videos = await Video.find({ channel: channel._id });
    const videoIds = videos.map((video) => video._id);
    await Comment.deleteMany({ video: { $in: videoIds } });

    // Delete Cloudinary media for each video (video and thumbnail)
    for (const video of videos) {
      try {
        if (video.videoPublicId) {
          await cloudinary.uploader.destroy(video.videoPublicId, {
            resource_type: "video",
          });
        }
        if (video.thumbnailPublicId) {
          await cloudinary.uploader.destroy(video.thumbnailPublicId);
        }
      } catch (err) {
        console.error("Cloudinary deletion error for video:", err.message);
      }
    }

    // Delete videos from DB
    await Video.deleteMany({ channel: channel._id });

    // Delete channel banner from Cloudinary
    if (channel.bannerPublicId) {
      try {
        await cloudinary.uploader.destroy(channel.bannerPublicId);
      } catch (err) {
        console.error(
          "Failed to delete channel banner from Cloudinary:",
          err.message
        );
      }
    }

    // Delete channel from DB
    await channel.deleteOne();

    // Optional: remove channel reference from user
    await User.findByIdAndUpdate(userId, {
      $pull: { channels: channel._id },
    });

    res.json({
      message: "Channel, its videos, banner, and comments deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting channel:", err);
    res.status(500).json({ error: err.message || "Failed to delete channel" });
  }
};

// TOGGLE SUBSCRIPTION
// controllers/channelController.js
export const toggleSubscription = async (req, res) => {
  const userId = req.user._id;
  const channelId = req.params.id;

  const channel = await Channel.findById(channelId);
  if (!channel) {
    return res.status(404).json({ message: "Channel not found" });
  }

  const alreadySubscribed = channel.subscribersList.includes(userId);

  if (alreadySubscribed) {
    channel.subscribersList.pull(userId);
  } else {
    channel.subscribersList.push(userId);
  }

  channel.subscribers = channel.subscribersList.length;
  
  await channel.save();

  const updatedChannel = await Channel.findById(channelId).populate(
    "owner",
    "name"
  );

  // Also update user.subscriptions if needed
  const user = await User.findById(userId);
  if (alreadySubscribed) {
    user.subscriptions.pull(channelId);
  } else {
    user.subscriptions.push(channelId);
  }

  await user.save();

  res.status(200).json(updatedChannel);
};
