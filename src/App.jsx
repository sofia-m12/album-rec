
import './App.css'
import { FormControl, InputGroup, Container, Button, Card, Row } from "react-bootstrap";
import { useState, useEffect } from "react";
const clientID = import.meta.env.VITE_CLIENT_ID;
const clientSecret = import.meta.env.VITE_CLIENT_SECRET;

function App() {
  const [searchInput, setSearchInput] = useState("");
  const [albums, setAlbums] = useState([]);
  const [expandedAlbums, setExpandedAlbums] = useState([]); 
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

      //GET album features
      async function getAlbumTracks(albumID) {
        try{
          let trackParams = {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + accessToken,
            },
          };

          //Getting the tracks on the specified album
          const tracks = await fetch(
            "https://api.spotify.com/v1/albums/" + albumID + "/tracks",
            trackParams
          )
          .then((result) => result.json)
          .then((data) => data.items);

          //Get all the artists on the album
          const artistData = new Map();
          tracks.items.forEach((track) => {
            track.artists.forEach((artist) => {
              artistData.set(artist.id, artist.name);
            });
          });

          //get theses artists albums
          const featuredArtistsAlbums = [];
          for(const [fartistID, fartistName] of artistData.entries()) {
            const falbumsResponse = await fetch(
              "https://api.spotify.com/v1/artists/" + fartistID + "/albums?include_groups=album&market=US&limit=5",
              {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              }
            );

            const albumData = await falbumsResponse.json();
            featuredArtistsAlbums.push({
              fartistName,
              albums: albumData.items,
            });
          }
          //Convert the map entries to array for rendering
          setExpandedAlbums(featuredArtistsAlbums);
        } catch(error) {
        console.error("Error fetching data: ", error);
        }
      }

      console.log("search input: " + searchInput);
      console.log("artist id: " + artistID);
      console.log("albums: " + setAlbums);
  }

  return (
    <Container>
      <Container style={{fontFamily: "cursive",
        fontSize: "40px",
        }}>Enrich Your Music Taste!
      </Container>
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
            borderWidth: "1px",
            borderStyle: "dotted",
            borderRadius: "5px",
            marginRight: "10px",
            paddingLeft: "10px",
          }}
        />

        <Button onClick={search}>Search</Button>
      </InputGroup>
      <Container>
      <Row
        style={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "space-around",
          alignContent: "center",
        }}>
        {
          //Displaying each album as a Card
          albums.map((album) => {
            return (
              <Card
                key={album.id}
                style={{
                  backgroundColor: 'purple',
                  margin: "10px",
                  borderRadius: "3%",
                  marginBottom: "30px",
                  width: "200px",
                  height: "375px",
                }}
              >
                <Card.Title
                    style={{
                      whiteSpace: "wrap",
                      fontWeight: "normal",
                      maxWidth: "100%",
                      fontSize: "20px",
                      marginTop: "5px",
                      color: "white",
                      fontFamily: "sans-serif",
                    }}>
                    {album.name}
                </Card.Title>
                <Card.Img 
                  width={180}
                  src={album.images[0].url}
                  style={{
                    borderRadius: "3%",
                    marginTop: "10px",
                    marginBottom: "15px",
                  }}
                />
                <Card.Body>
                    <Button
                      style={{
                        maxWidth: "fit-content",
                        marginLeft: "5px",
                        borderRadius: "70%",
                      }}
                      onClick={getAlbumTracks(album.id)}>Icon
                    </Button>

                  <Card.Text
                    style={{color: "white", fontWeight: "lighter", fontFamily: "sans-serif",}}>
                    Released: {album.release_date}
                  </Card.Text>
                  <Button
                    href={album.external_urls.spotify}
                    style={{
                      backgroundColor: "black",
                      color: "#1ED760",
                      fontWeight: "normal",
                      fontSize: "10px",
                      borderRadius: "5px",
                      borderWidth: "5px",
                      borderColor: "white",
                      padding: "10px",
                      fontFamily: "sans-serif",
                    }}>
                    SPOTIFY
                  </Button>
                </Card.Body>
              </Card>
            );
          })
        }
      </Row>
      </Container>
    </Container>
  );
}

export default App
