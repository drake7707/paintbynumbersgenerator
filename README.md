# Paint by numbers generator
Generate paint by number images (vectorized with SVG) from any input image.

## Demo

Try it out [here](https://drake7707.github.io/paintbynumbersgenerator/index.html)

### CLI Version

The CLI version is a self contained node application that does the conversion from arguments, for example:
```
paint-by-numbers-generator-win.exe -i input.png -o output.svg
```
You can change the settings in settings.json or optionally specify a specific settings.json with the `-c path_to_settings.json` argument.


## Screenshots

![Screenshot](https://i.imgur.com/6uHm78x.png])

![Screenshot](https://i.imgur.com/cY9ieAy.png)


## Example output

![ExampleOutput](https://i.imgur.com/2Zuo13d.png)

![ExampleOutput2](https://i.imgur.com/SxWhOc7.png)

## Running locally

I used VSCode, which has built in typescript support. To debug it uses a tiny webserver to host the files on localhost. 

To run do `npm install` to restore packages and then `npm start` to start the webserver


## Compiling the cli version

Install pkg first if you don't have it yet `npm install pkg -g`. Then in the root folder run `pkg .`. This will generate the output for linux, windows and macos.
