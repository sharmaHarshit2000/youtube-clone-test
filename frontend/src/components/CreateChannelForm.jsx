import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createChannel, clearChannelState } from '../features/channel/channelSlice';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Loader from './Loader';

const CreateChannelForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentChannel, loading, error } = useSelector((state) => state.channel);

  const [channelName, setChannelName] = useState('');
  const [description, setDescription] = useState('');
  const [channelBanner, setChannelBanner] = useState(null);

  useEffect(() => {
    return () => {
      dispatch(clearChannelState());
    };
  }, [dispatch]);

  useEffect(() => {
    if (currentChannel && currentChannel._id) {
      navigate(`/channel/${currentChannel._id}`);
    }
  }, [currentChannel, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("channelName", channelName);
    formData.append("description", description);
    if (channelBanner) {
      formData.append("banner", channelBanner);
    }

    try {
      const createdChannel = await dispatch(createChannel(formData)).unwrap();
      toast.success("Channel created successfully!");
      navigate(`/channel/${createdChannel._id}`);
    } catch (error) {
      toast.error(error.message || "Channel creation failed");
    }
  };

  if (currentChannel && currentChannel._id) return null;

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 z-10 bg-white bg-opacity-60 flex items-center justify-center">
          <Loader />
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        encType="multipart/form-data"
        className="space-y-4 max-w-md mx-auto mt-10 bg-white p-6 rounded-lg shadow"
      >
        <h2 className="text-xl font-semibold text-center">Create Your Channel</h2>

        <input
          type="text"
          name="channelName"
          placeholder="Channel Name"
          value={channelName}
          onChange={(e) => setChannelName(e.target.value)}
          required
          className="w-full p-2 border rounded"
        />

        <textarea
          placeholder="Channel Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 border rounded"
        />

        <input
          name="banner"
          type="file"
          accept="image/*"
          onChange={(e) => setChannelBanner(e.target.files[0])}
          className="w-full"
        />

        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Creating...' : 'Create Channel'}
        </button>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      </form>
    </div>
  );
};

export default CreateChannelForm;
