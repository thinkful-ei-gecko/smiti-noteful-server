const express = require( 'express' )
const path = require( 'path' )
const NotesService = require( './notes-service' )

const noteRouter = express.Router()
const jsonParser = express.json()

noteRouter

  .route( '/note' )

  .get( ( req, res, next ) => {
    const knexInstance = req.app.get( 'db' )
    NotesService.getAllNotes( knexInstance )
      .then( ( notes ) => {
        res
          .status( 200 )
          .json( notes )
      } )
      .catch( next )
  } )

  .post( jsonParser, ( req, res, next ) => {
    const { name, folderid, content } = req.body
    if ( !( name && folderid ) ) {
      return res.status( 400 ).json( {
        error : { message : 'Incomplete note submission.' }
      } )
    }

    const newNote = {
      name, 
      folderid
    }

    if ( content ) {
      newNote.content = content
    }

   
    NotesService.insertNote(
      req.app.get( 'db' ),
      newNote
    )
      .then( ( note ) => {
        res
          .status( 201 )
          .location( path.posix.join( req.originalUrl, `/${note.id}` ) )
          .json( note )
      } )
      .catch( next )
  } )


noteRouter

  .route( '/note/:noteId' )

  .all( ( req, res, next ) => {
    NotesService.getNoteById(
      req.app.get( 'db' ),
      req.params.noteId
    )
      .then( ( note ) => {
        if ( !note ) {
          return res.status( 404 ).json( {
            error : { message : 'Note not found.' }
          } )
        }
        res.note = note // save note for next middlewear, and pass on to next
        next()
      } )
      .catch( next )
  } )

  .get( ( req, res, next ) => {
    res.json( res.note )
  } )
  
  .patch( jsonParser, ( req, res, next ) => {
    const { name, folderId, content } = req.body
    const noteToUpdate = { name, folderId, content }
    const numberOfUpdatedFields = Object.values( noteToUpdate ).filter( Boolean ).length
    if ( numberOfUpdatedFields === 0 ) {
      return res.status( 400 ).json( {
        error : {
          message : 'Request body must contain at least one field to update'
        }
      } )
    }
    const modified = new Date()
    const newNoteFields = {
      ...noteToUpdate, 
      modified
    }
    
    NotesService.updateNote(
      req.app.get( 'db' ),
      res.note.id,
      newNoteFields
    )
      .then( ( updatedNote ) => {
        res
          .status( 200 )
          .json( updatedNote[0] )
      } )
      .catch( next )
  } )
    
  .delete( ( req, res, next ) => {
    NotesService.deleteNote(
      req.app.get( 'db' ),
      req.params.noteId
    )
      .then( ( numRowsAffected ) => {
        res
          .status( 204 )
          .end()
      } )
      .catch( next )
  } )
    
module.exports = noteRouter