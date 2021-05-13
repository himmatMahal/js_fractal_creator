const Jimp    = require('jimp');
const Complex = require('complex.js');
var   args    = process.argv.slice(2);

if (args.length < 2) {
    console.log("Usage: $ node app.js <size> <max iterations> <filename> <optional: a-value> <optional: c-value>");
    process.exit(1);
}
 
let sizesq = args[0];  // image size
let maxitr = args[1];  // max iterations
let filenm = args[2];  // output filename
let a      = args[3];  // a value - default 1 ( Standard Newton's Method )
let c      = args[4];  // c value - default 0 ( Standard Newton's Method )
if ( !(a) ) {
    a = 1;
}
if ( !(c) ) {
    c = 0;
}


// complex grid dimensions
let topLeft  = new Complex(-2, 2);
let stepsize = (4.0 / sizesq); 


let newtonsMethodNova = (f, fp, x0, max_iter, a, c) => {
    /** f   - returns complex, takes 1 complex param
     *  fp  - derivative of f
     *  x0  - initial guess
     *  a,c - parameters for nova fractal, default (1,0) for newtons method
     */
    let root = new Complex(x0);
    for (let i=0; i<max_iter; i++) {
        let subVal = f(root).div(fp(root)).mul(a);  
        root = root.sub( subVal ).add( c );
    }
    return root;
} 

function juliaSet( filepath, topLeft, stepsize, cc, nn, maxitr, escapeRad ) {
    new Jimp(sizesq, sizesq, 0x000000ff, function (err, image) {
        if (err) {
            throw err;
        }
        
        image.scan( 0, 0, image.bitmap.width, image.bitmap.height, 
            (x, y, idx) => {
                let p = topLeft.add(new Complex(stepsize*x, (-1)*stepsize*y));
                let i = 0;
                while ( ( (i++) < maxitr ) && ( p.abs() < escapeRad ) ) {
                    p = p.pow(nn).add(cc);
                }
                if (i == maxitr) {
                    this.bitmap.data[idx + 0] = 255;     
                    this.bitmap.data[idx + 1] = 255;    
                    this.bitmap.data[idx + 2] = 255; 
                }
                else {
                    this.bitmap.data[idx + 0] = (i*i*i*i) % 255;     
                    this.bitmap.data[idx + 1] = (i*i)     % 255;    
                    this.bitmap.data[idx + 2] = (i)       % 255; 
                }
            } 
        );
        
        console.log("done "+filepath);        
        image.write(filepath);
    }); 
}


function novaFractal( filepath, topLeft, stepsize, f, fp, a, c, maxitr ) {
    new Jimp(sizesq, sizesq, 0x000000ff, function (err, image) {
        if (err) {
            throw err;
        }
        
        image.scan( 0, 0, image.bitmap.width, image.bitmap.height, 
            (x, y, idx) => {
                let p = topLeft.add(new Complex(stepsize*x, (-1)*stepsize*y));
                let z = newtonsMethodNova(f, fp, p, maxitr, a, c);
                if ( !( z.isNaN() ) ) {
                    this.bitmap.data[idx + 0] = ((z.re.toFixed()*40)+100)%255;     
                    this.bitmap.data[idx + 1] = z.re.toFixed()*20;    
                    this.bitmap.data[idx + 2] = ((z.im.toFixed()*55)+20)%255; 
                }
            } 
        );
        
        console.log("done "+filepath);        
        image.write(filepath);
    });    
}

// Creating the fractal

/** functions to apply method to
 */
let f = (x) => {
    return x.sin().pow(2);
}
let fp = (x) => {
    return x.sin().mul(2).mul(x.cos());
}

novaFractal(filenm, topLeft, stepsize, f, fp, a, c, maxitr);

let n = 100; // number of frames   
for (let i=n; i<n; i++) {
    let t  = Complex.PI.mul( 0.90 ).add( Complex.PI.mul( i/(30*n) ) );
    let cc = new Complex( t.cos().re, t.sin().re );
    console.log(cc);
    juliaSet( `juulia_${ i.toString().padStart(3, "0") }.png`, topLeft, stepsize, cc, 2, maxitr, 3 );
}

