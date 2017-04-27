(function () {

  const DEPTH = 10;
  const BREADTH = 12;

  var compares = 0; // count of compare operations

  var $numbers = document.querySelector('#numbers');

  function randomNumber(bottom, top) {
    return Math.floor( Math.random() * ( 1 + top - bottom ) ) + bottom;
  }

  function generateSet(depth){
    var arr = [];
    for( i=0; i<depth; i++ ){
        arr[i] = Math.floor(100*Math.random());
    }
    return arr.sort(function(a, b) {return a - b;});
  }

  // source is an observable that simulates the
  // asynch arrival of responses from the collectors
  var source = Rx.Observable
    .range(1, BREADTH)
    .concatMap(function (x) {
        return Rx.Observable
        .of(generateSet(DEPTH))
        .delay(randomNumber(1000,5000));
    })

  var sets = [];     // the master array of sets
  var solution = []; // a sorted array of values

  // we work on the solution in the background as the 
  // sets are arriving from the generator by accessing
  // the global "sets" array
  var worker = setInterval(function(){ 
        if( sets.length == 0 ) return;
        var smallest = pop_smallest();
        add_to_solution(smallest);
        console.log("partial =",solution.toString());
  }, 1000); // really can move this along faster

  function pop_smallest(){
        var small = sets[0][0];
        var index = 0;
        for( i=0; i<sets.length; i++){
            let top = sets[i][0];
            if( top < small ){
                small = top;
                index = i;
            }
        }
        return sets[index].shift();
  }

  function finalize(){
    console.log("all sets have arrived... finalize");
    // the final set has come in and must be fully processed
    // as it could have the entire solution, so while there
    // is a better value in any set... add it to solution
    var candidate = pop_smallest();
    var delta = compare(candidate,solution[solution.length-1]);
    while( delta < 0 ){
        add_to_solution(candidate);
        console.log("partial = ",solution.toString());
        candidate = pop_smallest();
        delta = compare(candidate,solution[solution.length-1])
    }
    console.log("final = ",solution.toString());
  }

  function add_to_solution(number){
    // insert the value into the array
    solution = insert(solution,number)
    // but truncate at the right length
    solution.slice(0, DEPTH);
  }

  function tests(){
      console.log("compare 3 5 = ",compare(3,5));
      test([],3);
      test([9],3);
      test([5],7);
      test([5,6],7);
      test([5,9],7);
      test([5,9],4);
      test([1,2,5,9,11,12],4);
  };
  //tests();

  function test(arr,val){
      console.log("slot",val," into ",arr);
      let res = insert(arr,val);
      console.log(" ===> ",res);
  }

  function insert(array, value){
      // insert a value into an already sorted array; there
      // is probably a faster way to do this (but not critical)
      if( array.length == 0 ){
          return [value];
      } else if( array.length == 1 ){
        let result = array;
        let d = compare(result[0],value);
        if( d<=0 ) result.unshift(value);
        else result.push(value);
        return result;
      } else {
          let mid = Math.ceil(array.length / 2);
          let part1 = array.slice(0,mid);
          let part2 = array.slice(mid,array.length);
          let delta = compare(array[mid], value);
          if( delta == 0 ) part1.push(value);
          else if( delta < 0 ) part1 = insert(part1,value);
          else par2 = insert(part2,value);
          return part1.concat(part2);
      }
  }

  function compare(a,b){
      compares++;
      return b-a;
  }

  var observer = Rx.Observer.create(
    function (x) {
        console.log("Arrived: ",x.toString())
        sets.push(x);
        $numbers.innerHTML = x;
    },
    function (err) {
        console.log('Error: ', err);
        $numbers.innerHTML = "Error: " + err;
    },
    function () {
        console.log('Completed');
        $numbers.innerHTML = "Completed!";
        clearInterval(worker);
        finalize();
        console.log("compares = ",compares);
    });

  var subscription = source.subscribe(observer);

}());