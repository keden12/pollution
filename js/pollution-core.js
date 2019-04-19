//Note: OpenAQ API is not fully developed yet, pulling data from measurements cause timeouts - i'm pulling from latest values ordering the data by p10 value, 
//      some city values are actually not cities (I noticed some are even names) so wiki api will return null

// initialize accordion,transition,dropdown & popup
$(document).ready(function(){
	$('#records').transition();
	$('.ui.accordion').accordion();
	$('.ui.dropdown').dropdown();
	$('.ui.dropdown').popup({
				on:'manual'
		   });

	//hide the loading segment
	$('#load').hide();

});

//setting initial transition value
var transition = 0;

//making sure the browser will restore selected value
window.onload = function() {
 
    var option = sessionStorage.getItem('option');
    
	if (option !== null){

	$('.ui.dropdown').dropdown('set selected', option);
	
     }	
 
 
 
}
 
//making sure the browser will save selected value
window.onbeforeunload = function() {
 
        sessionStorage.setItem("option", $('.ui.dropdown').dropdown('get value'));
		
}	


//when the user clicks the search button
function fetchData() 
{  

   //cleaning up the accordion
   if(!$('#records').is(':empty'))
   {
     $('#records').empty();
   }
   
   //change values to uppercase & save in variable
   var value = $('.ui.dropdown').dropdown('get value').toUpperCase();
   
   //additional validation
   if(value != "PL" && value != "ES" && value != "DE" && value != "FR")
   {
            $('.ui.dropdown').popup('show');

   }
   else 
   {        //if it's the first transition, make the slide up effect for the image
            if(transition == 0)
			{
				$('#image').slideUp('slow');
				
			}
			
			else
			{
			    //show loading segment & hide the accordion
				$('#records').hide();
				$('#load').show(); 
			
			}

			//call the requestData function passing in the value 
			requestData(value);
			  
			//when all the ajax requests are completed
			$(document).ajaxStop(function(){
			    //remove the div in which the image is in
			    $('#space').remove();
			
			   //hide the loading segment
				$('#load').hide();
				
				//if it's the first transition, make the slide down animation
				if(transition == 0)
				{
				$('#records')
					  .transition({
						animation : 'slide down',
						duration  : 1500,
						interval  : 200
					  });
					  
				  transition = 1;	  
			    }
                
				//show the accordion			 
				$('#records').show();	   
				
			
			});
        
    }  
}


function requestData(value)
{
   //creating a new array for updated data with no duplicate cities
   var updatedData = [];
   var i = 0;
   
  //start ajax request to openaq api, setting the limit to 35 to eliminate duplicates, ordering by value, setting the parameter to pm10 and sorting in descending order
   $.ajax({ 
    type: 'GET', 
    url: 'https://api.openaq.org/v1/latest?order_by=measurements[0].value&sort=desc&parameter=pm10&limit=35&country='+value, 
    data: { get_param: 'value' }, 
    dataType: 'json',
    success: function (data) { 
				console.log('success openaq');
				
				
				//cleaning up the data from duplicates
				for(i; i < data.results.length;i++)
				{
				
				
					 //fixing spanish cities since some of them have CCAA prefix
					 if(data.results[i].city.includes("CCAA"))
					  {
					   data.results[i].city = data.results[i].city.replace('CCAA ','');
					  }
					  //fixing spanish cities
					  if(data.results[i].city.includes("Com."))
					  {
					  data.results[i].city = data.results[i].city.replace('Com. ','');
					  }
					
					  //simple check if the array already contains the city, if not it pushes the city into the array
					  if(!updatedData.includes(data.results[i].city, 0))
					  {
					   updatedData.push(data.results[i].city);
					  }
				
				}
				
				//making sure the array length will be 10
				updatedData.length = 10;
				
				
				//looping through the updated data
				$.each(updatedData, function(index, element) {
				
					   //adding titles to the accordion based on the cities in updatedData array 
					   $('#records').append('<div class="title title'+index+'"><i class="dropdown icon"></i>'+updatedData[index]+'</div>');
						
					   //wikipedia api request 
					   $.ajax({ 
					   type: 'GET', 
					   url: 'https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&format=json&redirects&callback=?&titles='+updatedData[index], 
					   data: { get_param: 'value' }, 
					   dataType: 'json',
					   success: function (data) { 
					   
							   console.log('success wiki');
							   
							   //getting the pagenumber key value to define the path to the extract value
							   var pagenum = Object.keys(data.query.pages);
							   //if the extract value is null
							   if(data.query.pages[pagenum[0]].extract == null)
							   {
									//letting the user know that there is no description available
									$('.title'+index).after('<div class="content"><p>No Description Available</p></div>');
								   
							   }
							   else
							   {
									//adding content to the accordion from the extract value
								   $('.title'+index).after('<div class="content"><p>'+data.query.pages[pagenum[0]].extract+'</p></div>');
							   }	
							}
											
					   });
						
				
				});
				
				
				
				
				
			
            }
    });


}

