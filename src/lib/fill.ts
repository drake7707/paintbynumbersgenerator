
// Faster flood fill from
// http://www.adammil.net/blog/v126_A_More_Efficient_Flood_Fill.html

export function fill(x: number, y: number, width: number, height: number, visited: ((i: number, j: number) => boolean), setFill: ((i: number, j: number) => void)) {

    // at this point, we know array[y,x] is clear, and we want to move as far as possible to the upper-left. moving
    // up is much more important than moving left, so we could try to make this smarter by sometimes moving to
    // the right if doing so would allow us to move further up, but it doesn't seem worth the complexit
    let xx = x;
    let yy = y;
    while (true) {
        const ox = xx;
        const oy = yy;
        while (yy !== 0 && !visited(xx, yy - 1)) { yy--; }
        while (xx !== 0 && !visited(xx - 1, yy)) { xx--; }
        if (xx === ox && yy === oy) { break; }
    }
    fillCore(xx, yy, width, height, visited, setFill);

}

function fillCore(x: number, y: number, width: number, height: number, visited: ((i: number, j: number) => boolean), setFill: ((i: number, j: number) => void)) {

    // at this point, we know that array[y,x] is clear, and array[y-1,x] and array[y,x-1] are set.
    // we'll begin scanning down and to the right, attempting to fill an entire rectangular block
    let lastRowLength = 0; // the number of cells that were clear in the last row we scanned
    do {
        let rowLength = 0;
        let sx = x; // keep track of how long this row is. sx is the starting x for the main scan below
        // now we want to handle a case like |***|, where we fill 3 cells in the first row and then after we move to
        // the second row we find the first  | **| cell is filled, ending our rectangular scan. rather than handling
        // this via the recursion below, we'll increase the starting value of 'x' and reduce the last row length to
        // match. then we'll continue trying to set the narrower rectangular block
        if (lastRowLength !== 0 && visited(x, y)) {
            do {
                if (--lastRowLength === 0) { return; } // shorten the row. if it's full, we're done
            } while (visited(++x, y)); // otherwise, update the starting point of the main scan to match
            sx = x;
        } else {
            for (; x !== 0 && !visited(x - 1, y); rowLength++ , lastRowLength++) {
                x--;
                setFill(x, y); // to avoid scanning the cells twice, we'll fill them and update rowLength here
                // if there's something above the new starting point, handle that recursively. this deals with cases
                // like |* **| when we begin filling from (2,0), move down to (2,1), and then move left to (0,1).
                // the  |****| main scan assumes the portion of the previous row from x to x+lastRowLength has already
                // been filled. adjusting x and lastRowLength breaks that assumption in this case, so we must fix it
                if (y !== 0 && !visited(x, y - 1)) { fill(x, y - 1, width, height, visited, setFill); } // use _Fill since there may be more up and left
            }
        }

        // now at this point we can begin to scan the current row in the rectangular block. the span of the previous
        // row from x (inclusive) to x+lastRowLength (exclusive) has already been filled, so we don't need to
        // check it. so scan across to the right in the current row
        for (; sx < width && !visited(sx, y); rowLength++ , sx++) { setFill(sx, y); }
        // now we've scanned this row. if the block is rectangular, then the previous row has already been scanned,
        // so we don't need to look upwards and we're going to scan the next row in the next iteration so we don't
        // need to look downwards. however, if the block is not rectangular, we may need to look upwards or rightwards
        // for some portion of the row. if this row was shorter than the last row, we may need to look rightwards near
        // the end, as in the case of |*****|, where the first row is 5 cells long and the second row is 3 cells long.
        // we must look to the right  |*** *| of the single cell at the end of the second row, i.e. at (4,1)
        if (rowLength < lastRowLength) {
            for (const end = x + lastRowLength; ++sx < end;) {                                          // there. any clear cells would have been connected to the previous
                if (!visited(sx, y)) { fillCore(sx, y, width, height, visited, setFill); } // row. the cells up and left must be set so use FillCore
            }
        } else if (rowLength > lastRowLength && y !== 0) {
            for (let ux = x + lastRowLength; ++ux < sx;) {
                if (!visited(ux, y - 1)) { fill(ux, y - 1, width, height, visited, setFill); } // since there may be clear cells up and left, use _Fill
            }
        }
        lastRowLength = rowLength; // record the new row length
    } while (lastRowLength !== 0 && ++y < height); // if we get to a full row or to the bottom, we're done

}
