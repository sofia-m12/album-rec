
import './App.css'
import { FormControl, InputGroup, Container, Button } from "react-bootstrap";
import { useState, useEffect } from "react";
const clientID = import.meta.env.VITE_CLIENT_ID;
const clientSecret = import.meta.env.VITE_CLIENT_SECRET;

function App() {
  const [searchInput, setSearchInput] = useState(""); //Use for API request
  const [accessToken, setAccessToken] = useState("");

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

  return (
    <Container>
      <InputGroup>
        <FormControl
          placeholder="artist"
          type="input"
          aria-label="artist"
          onKeyDown={} // search function
          onChange={} // setSearch
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

        <Button onClick={{}}>Search</Button>
      </InputGroup>
    </Container>
  );
}

export default App
