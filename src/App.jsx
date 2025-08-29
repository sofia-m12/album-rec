import './App.css'
import { FormControl, InputGroup, Container, Button, Card, Row, Alert } from "react-bootstrap";
import { useState, useEffect } from "react";
const clientID = import.meta.env.VITE_CLIENT_ID;
const clientSecret = import.meta.env.VITE_CLIENT_SECRET;

function App() {
  const [searchInput, setSearchInput] = useState("");
  const [albums, setAlbums] = useState([]);
  const [expandedAlbums, setExpandedAlbums] = useState([]); 
  const [accessToken, setAccessToken] = useState(""); //Use for API request
  const [hasSearched, setHasSearched] = useState(false);
  const [noFeatures, setNoFeatures] = useState([]); //tracks which albums have no features
  const [error, setError] = useState(null); //user facing error state

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

  async function search() { //user search function
    setExpandedAlbums([]); //reset expanded albums

    let artistParams = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + accessToken,
      },
    };

    try {
      //check for empty search input
      if (searchInput.trim() === "") {
        setError("Please enter an artist name to search.");
        setHasSearched(false);
        return;
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
        "https://api.spotify.com/v1/artists/" + artistID + "/albums?include_groups=album&market=US&limit=50",
        artistParams
      )
        .then((result) => result.json())
        .then((data) => {
          setAlbums(data.items);  
        });
        setHasSearched(true); // search has been made with a response
        setError(null); //clear previous error
    } catch (error) {
      console.error("Error during search:", error); //debug
      setError("An error occurred during the search. Please try again.");
      setHasSearched(false);
    }
  }

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

      //Getting the array of tracks on the specified album
      let tracks;
      await fetch(
        "https://api.spotify.com/v1/albums/" + albumID + "/tracks",
        trackParams
      )
      .then((result) => result.json())
      .then((data) => {tracks = data.items;});
      console.log("tracks:", tracks); //TESTING

      //Get all the artists on the album
      const artistData = new Map();
      if(!tracks) {
        console.log("No tracks found for album: ", albumID);
        return;
      }
      tracks.forEach((track) => {
        track.artists.forEach((artist) => {
          artistData.set(artist.id, artist.name);
        });
      });

      //get theses artists albums
      const uniqueArtistsMap = new Map(); //used to check for duplicate artists
      let featuredArtistsAlbums = [];
      const artistEntries = Array.from(artistData.entries()).slice(1); //skip the first entry so the current artist is not rendered twice
      for(const [fartistID, fartistName] of artistEntries) {
        if(!uniqueArtistsMap.has(fartistID)) { //proceed with API call if artist is not a duplicate
            const falbumsResponse = await fetch(
            "https://api.spotify.com/v1/artists/" + fartistID + "/albums?include_groups=album&market=US&limit=50",
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          const albumData = await falbumsResponse.json();

          //check that featured artist actually have albums to render
          if (albumData.items && albumData.items.length > 0) {
            uniqueArtistsMap.set(fartistID, {
              fartistID,
              fartistName,
              albums: albumData.items,
            });
          }
        }
        
      }
      featuredArtistsAlbums = Array.from(uniqueArtistsMap.values());  //Convert the map entries to array for rendering

      if (featuredArtistsAlbums.length > 0) {
        setExpandedAlbums(prevExpanded => {
          const allUniqueArtists = new Map();

          prevExpanded.forEach(artist => { //add previous artists first
            allUniqueArtists.set(artist.fartistID, artist);
          });
          featuredArtistsAlbums.forEach(artist => { //only add new artists
            allUniqueArtists.set(artist.fartistID, artist);
          });
          return Array.from(allUniqueArtists.values()); //convert map to array
        });
      } else {
        setNoFeatures(prev => [...prev, albumID]); //track albums with no features
      }
    } catch(error) {
      console.error("Error fetching data: ", error);
      setNoFeatures(prev => [...prev, albumID]);
    }
  }
  useEffect(() => {
  //console.log("expandedAlbums updated:", expandedAlbums); //logging expandedAlbums for testing
  }, [expandedAlbums]);

  return (
    <Container>
      <Container style={{fontFamily: "cursive",
      fontSize: "40px",
      }}>Enrich Your Music Taste!
      </Container>
      <InputGroup>
      <FormControl
        id="searchInput"
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

      {error && (
        <Alert 
          variant="danger" 
          onClose={() => setError(null)}
          dismissible
          style={{ marginTop: "10px", fontFamily: "sans-serif", padding: "15px" }}
        >
          {error}
        </Alert>
      )}

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
            backgroundColor: "#000000",
            margin: "10px",
            borderRadius: "3%",
            borderStyle: 'solid',
            borderColor:'white',
            marginBottom: "10px",
            flexBasis: "180px",
            flexGrow: 1,
            maxWidth: "250px",
            }}
          >
            <Card.Title
            style={{
              fontWeight: "normal",
              maxWidth: "100%",
              fontSize: "20px",
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
            }}
            onClick={() => { 
            console.log('Album cover clicked', album.id); //TEST
            getAlbumTracks(album.id)}}
            
            />
            <Card.Body>
              {noFeatures.includes(album.id) && (
                <Alert
                    variant="info"
                    style={{
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.55rem',
                      margin: '5px auto 0 auto',
                      width: 'fit-content',
                      borderRadius: '0.3rem'
                    }}>
                    No features found for this album
                  </Alert>
              )}
            <div className="d-flex align-items-center flex-column">
              <Card.Text
              style={{color: "white", fontWeight: "lighter", fontFamily: "sans-serif",}}>
              {album.release_date}
              </Card.Text>
              <Button
              href={album.external_urls.spotify}
              target="_blank" //opens link in new tab
              rel="noopener noreferrer"
              style={{
                backgroundColor: "#181C14",
                color: "#1ED760",
                fontWeight: "normal",
                fontSize: "10px",
                borderRadius: "3px",
                borderWidth: "2px",
                borderColor: "white",
                borderStyle: "solid",
                padding: "10px",
                fontFamily: "sans-serif",
              }}>
              SPOTIFY
              </Button>
            </div>
            </Card.Body>
          </Card>
          );
        })
        }
      </Row>
      </Container>

      {hasSearched && expandedAlbums && expandedAlbums.length > 0 && (
      <Container>
        <h1 style={{fontFamily: "sans-serif", marginTop: "15px",}}>
        Featured Artists Albums:
        </h1>
        {expandedAlbums.map((eArtist, index) => (
          <div key={index} style={{width : "100%"}}>
            <h2 style={{fontFamily: "sans-serif", marginTop: "15px",}}>
              {eArtist.fartistName}'s Albums:
            </h2>
            <Row 
              style={{
              display: "flex",
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "space-around",
              alignContent: "center",
              }}>
          {eArtist.albums.map((eAlbum) => (
          <Card
          key={eAlbum.id}
          style={{
            backgroundColor: "#000000",
            margin: "10px",
            borderRadius: "3%",
            borderStyle: 'solid',
            borderColor:'white',
            marginBottom: "10px",
            flexBasis: "180px",
            flexGrow: 1,
            maxWidth: "200px",
          }}>
          <Card.Title
            style={{
            fontWeight: "normal",
            maxWidth: "100%",
            fontSize: "20px",
            color: "white",
            fontFamily: "sans-serif",
            }}>
            {eAlbum.name}
          </Card.Title>
          <Card.Img
            width={180}
            src={eAlbum.images[0].url}
            style={{
            borderRadius: "3%",
            }}
            onClick={() => { 
            console.log('Album cover clicked', eAlbum.id); //TEST
            getAlbumTracks(eAlbum.id)}}
          />
          <Card.Body>
              {noFeatures.includes(eAlbum.id) && (
                  <Alert
                    variant="info"
                    style={{
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.55rem',
                      margin: '5px auto 0 auto',
                      width: 'fit-content',
                      borderRadius: '0.3rem'
                    }}>
                    No features found for this album
                  </Alert>
                )}
            <div className="d-flex align-items-center flex-column">
            <Card.Text
              style={{color: "white", fontWeight: "lighter", fontFamily: "sans-serif",}}>
              {eAlbum.release_date}
            </Card.Text>
            <Button
              href={eAlbum.external_urls.spotify}
              target="_blank"
              rel="noopener noreferrer"
              style={{
              backgroundColor: "#181C14",
              color: "#1ED760",
              fontWeight: "normal",
              fontSize: "10px",
              borderRadius: "3px",
              borderWidth: "2px",
              borderColor: "white",
              borderStyle: "solid",
              padding: "10px",
              fontFamily: "sans-serif",
              }}>
              SPOTIFY
            </Button>
            </div>
          </Card.Body>
          </Card>
        ))}
        </Row>
          {/* Divider only if not the last artist */}
          {index < expandedAlbums.length - 1 && (
            <hr className="artist-divider" />
          )}
        </div>
        ))}
       </Container>
       )
      }
    </Container>
    );
}

export default App
