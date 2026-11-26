export type AddressInput={label:string;contact_name:string;phone:string;city:string;pincode:string;delivery_address:string};
export type SavedAddress=AddressInput&{id:string};
export const blankAddress:AddressInput={label:"",contact_name:"",phone:"",city:"",pincode:"",delivery_address:""};
export function parseAddress(value:unknown):AddressInput|null{
 if(!value||typeof value!=="object")return null;
 const row=value as Record<string,unknown>;
 const read=(k:keyof AddressInput)=>typeof row[k]==="string"?row[k].trim():"";
 const address={label:read("label"),contact_name:read("contact_name"),phone:read("phone"),city:read("city"),pincode:read("pincode"),delivery_address:read("delivery_address")};
 if(address.label.length<2||address.label.length>40||address.contact_name.length<2||address.contact_name.length>100||!(/^[6-9][0-9]{9}$/).test(address.phone)||address.city.length<2||address.city.length>80||!(/^[1-9][0-9]{5}$/).test(address.pincode)||address.delivery_address.length<12||address.delivery_address.length>300)return null;
 return address;
}
export function parseSavedAddress(value:unknown):SavedAddress|null{
 if(!value||typeof value!=="object")return null;
 const row=value as Record<string,unknown>,address=parseAddress(row);
 return address&&typeof row.id==="string"&&/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(row.id)?{...address,id:row.id}:null;
}
