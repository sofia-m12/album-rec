
import './App.css'
import { FormControl, InputGroup, Container, Button, Card, Row } from "react-bootstrap";
import { useState, useEffect } from "react";
const clientID = import.meta.env.VITE_CLIENT_ID;
const clientSecret = import.meta.env.VITE_CLIENT_SECRET;

function App() {
  const [searchInput, setSearchInput] = useState("");
  const [albums, setAlbums] = useState([]);  //Initialized as empty array/list
  const [accessToken, setAccessToken] = useState(""); //Use for API request

  //Hook
  useEffect( () => {
    let authParams = {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body:
        "grant_type=client_credentials&client_id=" +
        clientID +
        "&client_secret=" +
        clientSecret,
      };
      fetch("https://accounts.spotify.com/api/token", authParams)
        .then((result) => result.json())
        .then((data) => {
          setAccessToken(data.access_token);
        });
    },
  []);

  async function search() {
    let artistParams = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + accessToken,
      },
    }
    
    //GET artist
    const artistID = await fetch(
      "https://api.spotify.com/v1/search?q=" + searchInput + "&type=artist",
      artistParams
    )
      .then((result) => result.json())
      .then((data) => {
        return data.artists.items[0].id;
      });

    //GET albums
    await fetch(
      "https://api.spotify.com/v1/artists/" + artistID + "/albums?include_groups=album&market=US&limit=30",
      artistParams
    )
      .then((result) => result.json())
      .then((data) => {
        setAlbums(data.items);  
      });

      console.log("search input: " + searchInput);
      console.log("artist id: " + artistID);
      console.log("albums: " + setAlbums);
  }

  return (
    <Container>
      <InputGroup>
        <FormControl
          placeholder="artist"
          type="input"
          aria-label="artist"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              search();
            }
          }} // search function
          onChange={(event) => setSearchInput(event.target.value)} // setSearch
          style={{
            width: "300px",
            height: "35px",
            borderWidth: "0px",
            borderStyle: "solid",
            borderRadius: "5px",
            marginRight: "10px",
            paddingLeft: "10px",
          }}
        />

        <Button onClick={search}>Search</Button>
      </InputGroup>
    </Container>
  );
}

export default App
