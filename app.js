const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
app.use(express.json())

const databasePath = path.join(__dirname, 'moviesData.db')
module.exports = app

let database = null

const initializeDBAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

function converting(eachObj) {
  return {movieName: eachObj.movie_name}
}
app.get('/movies/', async (request, response) => {
  const getMovies = `
      SELECT movie_name
      FROM movie;`
  const moviesArray = await database.all(getMovies)
  response.send(moviesArray.map(eachObj => converting(eachObj)))
})

app.post('/movies/', async (request, response) => {
  const {directorId, movieName, leadActor} = request.body

  const addPlayersQuery = `
    INSERT INTO 
        movie(director_id,movie_name,lead_actor)
    VALUES (
        ${directorId},
         '${movieName}',
         '${leadActor}'
   );`

  await database.run(addPlayersQuery)

  response.send('Movie Successfully Added')
})

app.get('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const getMovieOnMovieId = `
    SELECT
        movie_id as movieId,
        director_id as directorId,
        movie_name as movieName,
        lead_actor as leadActor 
    FROM 
        movie
    WHERE 
        movie_id = ${movieId};
        `
  const result = await database.get(getMovieOnMovieId)
  response.send(result)
})

app.put('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params

  const {directorId, movieName, leadActor} = request.body
  const updatedMoviesQuery = `
      UPDATE 
         movie 
      SET 
        director_id = ${directorId},
        movie_name = '${movieName}',
        lead_actor = '${leadActor}'
      WHERE 
          movie_id = ${movieId};
          `
  await database.run(updatedMoviesQuery)
  response.send('Movie Details Updated')
})

app.delete('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const deleteMovieQuery = `
       DELETE FROM
           movie 
       WHERE 
          movie_id = '${movieId}';
          `
  await database.run(deleteMovieQuery)
  response.send('Movie Removed')
})

function convertingCase(eachObj) {
  return {
    directorId: eachObj.director_id,
    directorName: eachObj.director_name,
  }
}
app.get('/directors/', async (request, response) => {
  const getDirector = `
       SELECT director_id,director_name
       FROM director;`
  const directorsArray = await database.all(getDirector)
  response.send(directorsArray.map(eachObj => convertingCase(eachObj)))
})

app.get('/directors/:directorId/movies/', async (request, response) => {
  const {directorId} = request.params
  const responseQuery = `
      SELECT 
         movie.movie_name as movieName
      FROM 
         director NATURAL JOIN movie
      WHERE director.director_id = '${directorId}';
      `
  const result = await database.all(responseQuery)
  response.send(result)
})
