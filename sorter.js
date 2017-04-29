'use strict';

function range(n){
    // returns [0,1,2,3..,n]
    return [...Array(n).keys()]
}

function generateProblem(breadth,depth,limit){
    return range(breadth).map( i => generateSet(depth,limit) );
}

function randomInteger(bottom, top) {
    return Math.floor( Math.random() * ( 1 + top - bottom ) ) + bottom;
}

function generateSet(depth,limit){
    const rands = range(depth).map( x => randomInteger(0,limit) );
    return rands.sort( (a,b) => a-b );
}

function solver(data,answer) {

  const BREADTH = data.length;
  const DEPTH = data[0].length;
  const $numbers = document.querySelector('#numbers');

  var sets = [];     // the master array of sets
  var solution = []; // a sorted array of values
  var compares = 0;  // count of compare operations

  // source is an observable that simulates the
  // asynch arrival of responses from the collectors
  var source = Rx.Observable.zip(
    Rx.Observable.fromArray(data),
    Rx.Observable.timer(1000, 5000),  
    function(item, i) { return item;}
  );

  // we work on the solution in the background as the 
  // sets are arriving from the generator by accessing
  // the global "sets" array
  var worker = setInterval(function(){ 
        if( sets.length == 0 ) return;
        //put_status();
        var smallest = pop_smallest();
        //console.log("smallest",smallest);
        add_to_solution(smallest);
        //console.log("partial =",solution.toString());
  }, 1000); // really can move this along faster

  function put_status(){
      sets.forEach(s => console.log(s));
      console.log("before =",solution);
  }

  function pop_smallest(){
        var index = 0;
        var small = sets[0][0];
        for( var i=1; i<sets.length; i++){
            var top = sets[i][0];
            if( compare(top,small) > 0 ){
                small = top;
                index = i;
            }
        }
        return sets[index].shift();
  }

  function getCandidate(){
    //put_status();
    const candidate = pop_smallest();
    const last_soln = solution.slice(-1)[0];
    const delta = compare(candidate,last_soln);
    //console.log("candidate",candidate,"delta",delta);
    const isCandidate = delta > 0 || solution.length < DEPTH;
    return isCandidate ? candidate : null
  }

  function finalize(){
    var candidate = null;
    console.log("all sets have arrived... finalize");
    // the final set has come in and must be fully processed
    // as it could have the entire solution, so while there
    // is candidate value... add it to solution    
    while( candidate = getCandidate() ){
        //console.log("working = ",solution.toString());
        add_to_solution(candidate);
    }
    console.log("final = ",solution.toString());
  }

  function add_to_solution(number){
    // insert the value into the array, but truncate
    solution = insert(solution,number)
    // but truncate at the right length
    solution = solution.slice(0, DEPTH);
  }

  function tests(){
      console.log("compare 3 5 = ",compare(3,5));
      test([],3);
      test([9],3);
      test([18],34);
      test([5],7);
      test([5,6],7);
      test([5,9],7);
      test([5,9],4);
      test([1,2,5,9,11,12],4);

      test([ 1, 4, 16, 18 ],34);
  };
  //tests();

  function test(arr,val){
      console.log("slot",val," into ",arr);
      let res = insert(arr,val);
      console.log(" ===> ",res);
  }

  function insert(array, value){
      //console.log("   insert", array, value);
      // insert a value into an already sorted array; there
      // is probably a faster way to do this (but not critical)
      if( array.length == 0 ){
          return [value];
      } else if( array.length == 1 ){
        let result = array;
        let d = compare(result[0],value);
        if( d<=0 ) result.unshift(value);
        else result.push(value);
        //console.log("    -> ",result);
        return result;
      } else {
          let mid = Math.ceil(array.length / 2);
          let part1 = array.slice(0,mid);
          let part2 = array.slice(mid,array.length);
          let delta = compare(array[mid], value);
          if( delta == 0 ) part1.push(value);
          else if( delta < 0 ) part1 = insert(part1,value);
          else part2 = insert(part2,value);
          //console.log(part1,part2);
          return part1.concat(part2);
      }
  }

  function compare(a,b){
      // zero if equal
      // positive if second is larger
      compares++;
      return b-a;
  }

  var observer = Rx.Observer.create(
    function (x) {
        console.log("Partial =",solution.toString());
        console.log("Arrived =",x.toString())
        sets.push(x);
        $numbers.innerHTML = x;
    },
    function (err) {
        console.log('Error: ', err);
        $numbers.innerHTML = "Error: " + err;
    },
    function () {
        //console.log('Completed');
        $numbers.innerHTML = "Completed!";
        clearInterval(worker);
        console.log("before compares = ",compares);
        compares = 0; // reset the counter
        finalize();
        console.log("finalize compares = ",compares);
        const same = solution.reduce( (a,x,i)=>{return a&&(x==answer[i]); },true);
        if( same ){
            console.warn("success");
        } else {
            console.error("was not answer = ",answer);
        }
    }
  );

  var subscription = source.subscribe(observer);

};

function brute(data){
    const DEPTH = data[0].length;
    const merged = [].concat.apply([], data);
    return merged.sort((a,b)=>{return a-b;}).slice(0,DEPTH);
}

// var p1 = [ [5,6,10,36,49],[11,13,19,34,59],[8,48,70,93,94],[9,10,21,39,39],[12,13,43,51,69],[10,14,22,34,77]];
// solver(p1,brute(p1));

const px = generateProblem(5,7,1000);
solver(px,brute(px));
