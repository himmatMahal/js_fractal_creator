const Jimp    = require('jimp');
const Complex = require('complex.js');
var   args    = process.argv.slice(2);

if (args.length < 2) {
    console.log("Usage: $ node app.js <size> <filename>");
    process.exit(1);
}
 
let sizesq = args[0];  // image size
let filenm = args[1];  // output filename

// complex grid dimensions
let topLeft = new Complex(-2, 2);
let length  = 4.0; 

let maxitr  = 8;  // default max iterations

// Custom method 
let customMethod_a = (f, fp, x0, max_iter) => {
    /** f   - returns complex, takes 1 complex param
     *  fp  - derivative of f
     *  x0  - initial guess
     */
    let root = new Complex(x0);
    for (let i=0; i<max_iter; i++) {
        let subVal = f(root).add(fp(root)).div( fp(root).mul(f(root)) );
        root = root.sub( subVal );
    }
    return root;
}


// Newton's method
let newtonsMethod = (f, fp, x0, max_iter) => {
    /** f   - returns complex, takes 1 complex param
     *  fp  - derivative of f
     *  x0  - initial guess
     */
    let root = new Complex(x0);
    for (let i=0; i<max_iter; i++) {
        let subVal = f(root).div(fp(root));  
        root = root.sub( subVal );
    }
    return root;
} 


function fractal( filepath, topLeft, length, f, fp, maxitr, method_fn ) {
    /** filepath - name of output file (e.g. myFractal.png)
     *  topLeft  - anchor of top left corner of image in complex plane
     *  length   - length of square image in complex plane
     *  f        - function
     *  fp       - derivative of f
     *  maxitr   - maximum number of iterations for method
     *  method_fn - method to iterate to create fractal
     */
    
    let stepsize = length / sizesq;
    new Jimp(sizesq, sizesq, 0x000000ff, function (err, image) {
        if (err) {
            throw err;
        }
        
        image.scan( 0, 0, image.bitmap.width, image.bitmap.height, 
            (x, y, idx) => {

                let p = topLeft.add(new Complex(stepsize*x, (-1)*stepsize*y));
                let z = method_fn(f, fp, p, maxitr);
             
                // Applying color map to color the result of method 
                // a particular color
                if ( !( z.isNaN() ) ) {
                    let r = new Complex(z.re);
                    r = r.atan().div(Complex.PI.re).add(0.5).mul(255).re.toFixed();
                    let b = new Complex(z.im);
                    b = b.atan().div(Complex.PI.re).add(0.5).mul(255).re.toFixed();
                    this.bitmap.data[idx + 0] = (r + 100) % 255;     
                    this.bitmap.data[idx + 1] = 140;    
                    this.bitmap.data[idx + 2] = b; 
                }

            }
        );
        
        console.log("done "+filepath);        
        image.write(filepath);
    });    
}

/** Creating function to apply method to, a random combination of some
 *  polynomial with a sin function
 */

let b = Math.floor( 1 + 8*(Math.random()) );
let c = Math.floor( 1 + 8*(Math.random()) );
let d = Math.floor( 1 + 8*(Math.random()) );
let e = Math.floor( 1 + 20*(Math.random() - 0.5) );

let f = (x) => {
    return x.pow(b).add(x.pow(c).add(x.pow(d))).add(x.mul(e).sin());
}
let fp = (x) => {
    return x.pow(b-1).mul(b).add(x.pow(c-1).mul(c)
            .add(x.pow(d-1).mul(d)))
            .add(x.mul(e).cos().mul(e));
}

// Generate the image using either newton's method, or custom method a
let a = Math.floor( Math.random() + 0.5 );
if (a==1) {
    console.log("Using custom method");
    fractal( filenm, topLeft, length, f, fp, maxitr, customMethod_a );
}
else {
    console.log("Using newton's method");
    fractal( filenm, topLeft, length, f, fp, maxitr, newtonsMethod );
}
