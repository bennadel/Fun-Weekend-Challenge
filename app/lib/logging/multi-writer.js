
// Export the factory function.
exports.createMultiWriter = createMultiWriter;

// Export the constructor function.
exports.MultiWriter = MultiWriter;


// ----------------------------------------------------------------------------------- //
// ----------------------------------------------------------------------------------- //


// I create an instance of the multi writer, adding each writer to the collection of
// destination writers.
function createMultiWriter() {

	var writer = new MultiWriter();

	for ( var i = 0, length = arguments.length ; i < length ; i++ ) {

		writer.addWriter( arguments[ i ] );

	}

	return( writer );

}


// I implement the writer interface, writing messages to all the given destinations.
function MultiWriter() {

	this._writers = [];

}


// Configure "class" methods.
MultiWriter.prototype = {

	// ---
	// PUBLIC METHODS.
	// ---


	// I add the given writer to the collection of destination writers.
	addWriter: function( newWriter ) {

		this._writers.push( newWriter );

	},


	// I add the given writer to the collection of destination writers. Returns [this]
	// reference for method chaining.
	withWriter: function( newWriter ) {

		this.addWriter( newWriter );

		return( this );

	},


	// I write the given message to the destination writers.
	write: function( message ) {

		var error = null;

		for ( var i = 0, length = this._writers.length ; i < length ; i++ ) {

			// Since we don't want one write-failure to stop the entire write operation,
			// we'll defer throwing the error until the entire collection of writers has
			// had a chance to do its thang. 
			try {

				this._writers[ i ].write( message );
				
			} catch ( writeError ) {

				error = writeError;

			}

		}

		// If one of the writers failed, rethrow the exception.
		if ( error ) {

			throw( error );

		}

	}

};
