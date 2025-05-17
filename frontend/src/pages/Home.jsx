import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllVideos } from "../features/video/videoSlice";
import FilterBar from '../components/FilterBar';
import Loader from '../components/Loader';
import VideoCard from '../components/VideoCard';

const Home = () => {
  const dispatch = useDispatch();
  const { videos, loading } = useSelector((state) => state.videos);
  const { term } = useSelector((state) => state.search);
  const { isSidebarOpen } = useSelector((state) => state.ui);

  const [selectedFilter, setSelectedFilter] = useState('All');

  useEffect(() => {
    dispatch(fetchAllVideos());
  }, [dispatch]);

  const handleSelectFilter = (filter) => {
    if (selectedFilter === filter) {
      setSelectedFilter('All');
    } else {
      setSelectedFilter(filter);
    }
  };

  const filteredVideos = useMemo(() => {
    let filtered = videos;

    if (selectedFilter !== 'All') {
      filtered = filtered.filter((video) => video.category === selectedFilter);
    }

    if (term.trim()) {
      const lower = term.toLowerCase();
      filtered = filtered.filter((video) =>
        video.title?.toLowerCase().includes(lower)
      );
    }

    return filtered;
  }, [videos, selectedFilter, term]);

  if (loading) return <Loader />;

  const isFetchingCompleted = !loading && videos.length > 0;
  const isNoVideosAfterFilter = isFetchingCompleted && filteredVideos.length === 0;

  return (
    <div className="w-full">
      <FilterBar selectedFilter={selectedFilter} onSelectFilter={handleSelectFilter} />

      {isNoVideosAfterFilter ? (
        <p className="text-center text-gray-600 mt-10">No videos found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-6">
          {filteredVideos.map((video) => (
            <VideoCard key={video._id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
