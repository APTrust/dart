/*
  This is a list of legacy bags produced with earlier versions of DART
  and deposited into APTrust's production repo. When users create a new
  version of a legacy bag, we don't want to trim path names, because DART
  1.0 didn't trim them.

  Rebagging a legacy bag with trimmed path names would create
  all new file identifiers, which APTrust ingest would interpret
  as all new files. The depositor would then have two copies of each file
  in the bag and be charged double the storage cost. We want to avoid
  that, especially on the very large bags in this list, which range
  from hundreds of GB to over 1 TB.

  DART 1.0 untrimmed file identifiers used absolute paths and
  looked like this:

  abc.edu/bag/data/Users/joe/path/to/project/scan1.tiff
  abc.edu/bag/data/Users/joe/path/to/project/scan2.tiff
  abc.edu/bag/data/Users/joe/path/to/project/meta/desc.xml

  The new trimmed versions would look like this:

  abc.edu/bag/data/project/scan1.tiff
  abc.edu/bag/data/project/scan2.tiff
  abc.edu/bag/data/project/meta/desc.xml

*/

const LegacyBags = [
    'virginia.edu.bag-AviatorMain',
    'chd.virginia.edu.bag-RotundaEastCistern',
    'chd.virginia.edu.bag-RotundaCisternWest',
    'chd.virginia.edu.bag-WarmSpringsScanData',
    'chd.virginia.edu.bag-MonticelloArtifacts',
    'chd.virginia.edu.bag-RivArch_quartz_points_20150820',
    'chd.virginia.edu.bag-HawBranch3DData',
    'chd.virginia.edu.bag-Pav8Columns',
    'chd.virginia.edu.bag-Montpelier_StefanWoehlke_SouthYard',
    'nd.edu.bag-1544475426597_LIB_000873826_2016',
    'nd.edu.bag-1544627750109_RBSC_BAS948_2018',
    'nd.edu.bag-1544040785994_LIB_001676500_2015',
    'nd.edu.bag-1545152573921_LIB_000277843_2015',
    'nd.edu.bag-1546880418664_NDLAW_b1109756_2015',
    'nd.edu.bag-1544546788992_UNDA_000000003_2017',
    'nd.edu.bag-1546543685367_RBSC_MSHLAT0089_2018',
    'nd.edu.bag-1544553028758_UND_000000004_2015',
    'nd.edu.bag-1549657094892_LIB_000000005_2014',
    'nd.edu.bag-1551380910216_RBSC_000000010_2015',
    'vwu.edu.twp-arc-rg5-box22-pro-001-090',
    'vwu.edu.twp-arc-prg6-box3-pho-0001-0004',
    'vwu.edu.twp-arc-prg6-box4-pho-001-027',
    'vwu.edu.twp-arc-fou',
    'vwu.edu.twp-arc-prg12-box1-pho-001-129',
    'vwu.edu.twp-arc-prg13-box1-pho-001-101',
    'vwu.edu.twp-arc-rg6-box1-pub-001-070',
    'vwu.edu.twp-arc-new',
    'vwu.edu.twp-arc-new-bou',
    'vwu.edu.twp-arc-new-mic',
    'vwu.edu.twp-arc-prg10-box3-pho-001-110',
    'vwu.edu.bag.twp-arc-yea',
    'vwu.edu.twp-arc-dav-boxa-doc',
    'viul.virginia.edu.bag.archives',
    'viul.virginia.edu.archives',
    'viul.virginia.edu..archives',
    'viul.virginia.edu.1828',
    'viul.virginia.edu.bag.archives.dengrove',
    'viul.virginia.edu.archives.facultypublications',
    'viul.virginia.edu.archives.faculty-publications',
    'viul.virginia.edu.bag.archives.faculty-publications',
    'viul.virginia.edu.bag.archives.vlw-negatives'
]

module.exports.LegacyBags = LegacyBags;
