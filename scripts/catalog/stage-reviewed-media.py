# Transfer exact visually reviewed candidate bytes from the fixed GitHub artifact.
# No third-party network access, arbitrary file extraction, or production deployment.
import hashlib, json, pathlib, sys, zipfile
root=pathlib.Path("assets/catalog/brand-review")
expected=json.loads(pathlib.Path("scripts/catalog/reviewed-media-batch.json").read_text())
with zipfile.ZipFile(sys.argv[1]) as z:
 report=json.loads(z.read("report.json"))
 rows={x["file"]:x for x in report["results"] if x["status"]=="decoded"}
 plan=[]
 for item in expected["reviewed"]:
  h=item["sha256"]; name=h[:24]+".webp"; row=rows[name]
  data=z.read("images/"+name)
  if hashlib.sha256(data).hexdigest()!=h or len(data)!=row["bytes"] or len(data)>350*1024 or data[:4]!=b"RIFF" or data[8:12]!=b"WEBP":
   raise ValueError("Asset integrity failure: "+name)
  plan.append((name,data,{**item,"source":row["url"],"bytes":len(data)}))
 if len(plan)!=17: raise ValueError("Unexpected review batch size")
 root.mkdir(parents=True,exist_ok=True)
 for name,data,row in plan: (root/name).write_bytes(data)
 (root/"manifest.json").write_text(json.dumps({"artifactId":expected["artifactId"],"sourceCommit":expected["sourceCommit"],"assets":[r for _,_,r in plan],"failed":[x for x in report["results"] if x["status"]=="skipped"]},indent=2)+"\n")
 print("Staged",len(plan),"reviewed WebP files outside public/")
