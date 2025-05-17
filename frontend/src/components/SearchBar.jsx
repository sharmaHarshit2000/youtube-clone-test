import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { searchVideos } from "../features/videos/videoSlice";

const SearchBar = () => {
  const [input, setInput] = useState("");
  const dispatch = useDispatch();
  const { searchResults, searchLoading, searchError } = useSelector(state => state.videos);

  const handleSearch = (e) => {
    e.preventDefault();
    if (input.trim() !== "") {
      dispatch(searchVideos(input));
    }
  };

  return (
    <div>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search videos by title..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" disabled={searchLoading}>
          Search
        </button>
      </form>

      {searchLoading && <p>Loading...</p>}
      {searchError && <p>Error: {searchError}</p>}
      <ul>
        {searchResults.map((video) => (
          <li key={video._id}>{video.title}</li>
        ))}
      </ul>
    </div>
  );
};

export default SearchBar;
